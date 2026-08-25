import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';

// GET /api/sessions/[id]/signaling?since=timestamp
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const sessionId = params.id;
  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since');

  try {
    // Verify user is session participant
    const isParticipant = (await query(`
      SELECT 1 FROM sessions WHERE id = $1 AND (teacher_id = $2 OR learner_id = $3)
    `, [sessionId, user.userId, user.userId])).rows[0];

    if (!isParticipant) {
      return NextResponse.json({ error: 'Unauthorized: Not a session participant' }, { status: 403 });
    }

    const signalsQuery = `
      SELECT id, session_id, sender_id, receiver_id, signal_type, payload_json, created_at
      FROM session_signaling_messages
      WHERE session_id = $1 AND sender_id != $2 AND is_consumed = false AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 seconds'
      ORDER BY created_at ASC
      LIMIT 20
    `;
    const rawSignals = (await query(signalsQuery, [sessionId, user.userId])).rows as any[];

    if (rawSignals.length > 0) {
      const ids = rawSignals.map(r => r.id);
      await query(`
        UPDATE session_signaling_messages 
        SET is_consumed = true 
        WHERE id = ANY($1::text[])
      `, [ids]).catch(console.error);
    }

    const signals = rawSignals.map((s) => ({
      id: s.id,
      sessionId: s.session_id,
      senderId: s.sender_id,
      receiverId: s.receiver_id,
      signalType: s.signal_type,
      payload: JSON.parse(s.payload_json || '{}'),
      createdAt: s.created_at,
    }));

    // Also fetch active presence
    const presence = (await query(`
      SELECT user_id, display_name, role, camera_on, mic_on, screen_sharing, status, last_ping
      FROM session_room_presence
      WHERE session_id = $1
    `, [sessionId])).rows;

    return NextResponse.json({
      signals,
      presence,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Signaling GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve signals', details: err.message }, { status: 500 });
  }
}

// POST /api/sessions/[id]/signaling
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const sessionId = params.id;

  try {
    const session = (await query(`
      SELECT s.*, tp.display_name as teacher_name, lp.display_name as learner_name
      FROM sessions s
      LEFT JOIN profiles tp ON s.teacher_id = tp.user_id
      LEFT JOIN profiles lp ON s.learner_id = lp.user_id
      WHERE s.id = $1
    `, [sessionId])).rows[0] as any;

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const isTeacher = session.teacher_id === user.userId;
    const isLearner = session.learner_id === user.userId;

    if (!isTeacher && !isLearner) {
      return NextResponse.json({ error: 'Unauthorized: Not a session participant' }, { status: 403 });
    }

    const body = await req.json();
    const { signalType, payload, receiverId, cameraOn, micOn, screenSharing } = body;

    if (!signalType) {
      return NextResponse.json({ error: 'signalType is required' }, { status: 400 });
    }

    const signalId = `sig-${sessionId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const role = isTeacher ? 'TRAINER' : 'LEARNER';
    const displayName = isTeacher ? (session.teacher_name || 'Mentor') : (session.learner_name || 'Learner');

    await withTransaction(async (client) => {
      // 1. Insert signaling message
      await client.query(`
        INSERT INTO session_signaling_messages (
          id, session_id, sender_id, receiver_id, signal_type, payload_json, is_consumed, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP)
      `, [
        signalId,
        sessionId,
        user.userId,
        receiverId || (isTeacher ? session.learner_id : session.teacher_id),
        signalType,
        JSON.stringify(payload || {})
      ]);

      // 2. Update room presence
      const cam = cameraOn !== undefined ? Boolean(cameraOn) : true;
      const mic = micOn !== undefined ? Boolean(micOn) : true;
      const scr = screenSharing !== undefined ? Boolean(screenSharing) : false;

      await client.query(`
        INSERT INTO session_room_presence (
          id, session_id, user_id, display_name, role, camera_on, mic_on, screen_sharing, status, last_ping
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONNECTED', CURRENT_TIMESTAMP)
        ON CONFLICT(session_id, user_id) DO UPDATE SET
          display_name = excluded.display_name,
          role = excluded.role,
          camera_on = excluded.camera_on,
          mic_on = excluded.mic_on,
          screen_sharing = excluded.screen_sharing,
          status = 'CONNECTED',
          last_ping = CURRENT_TIMESTAMP
      `, [
        `pres-${sessionId}-${user.userId}`,
        sessionId,
        user.userId,
        displayName,
        role,
        cam,
        mic,
        scr
      ]);
    });

    return NextResponse.json({
      success: true,
      signalId,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Signaling POST Error:', err);
    return NextResponse.json({ error: 'Failed to dispatch signal', details: err.message }, { status: 500 });
  }
}
