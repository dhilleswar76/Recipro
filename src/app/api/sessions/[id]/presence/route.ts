import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const sessionId = params.id;
  try {
    const result = await query(`
      SELECT 
        p.user_id, p.display_name, p.role, p.camera_on, p.mic_on, p.screen_sharing, p.status, p.last_ping,
        pr.avatar
      FROM session_room_presence p
      LEFT JOIN profiles pr ON p.user_id = pr.user_id
      WHERE p.session_id = $1
    `, [sessionId]);

    return NextResponse.json({ presence: result.rows });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch presence' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const sessionId = params.id;
  try {
    const body = await req.json();
    const { cameraOn, micOn, screenSharing, status } = body;

    const sessionResult = await query(`
      SELECT s.*, tp.display_name as teacher_name, lp.display_name as learner_name
      FROM sessions s
      LEFT JOIN profiles tp ON s.teacher_id = tp.user_id
      LEFT JOIN profiles lp ON s.learner_id = lp.user_id
      WHERE s.id = $1
    `, [sessionId]);
    const session = sessionResult.rows[0] as any;

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const isTeacher = session.teacher_id === user.userId;
    const role = isTeacher ? 'TRAINER' : 'LEARNER';
    const displayName = isTeacher ? (session.teacher_name || 'Mentor') : (session.learner_name || 'Learner');

    await query(`
      INSERT INTO session_room_presence (
        id, session_id, user_id, display_name, role, camera_on, mic_on, screen_sharing, status, last_ping
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT(session_id, user_id) DO UPDATE SET
        display_name = excluded.display_name,
        role = excluded.role,
        camera_on = COALESCE(excluded.camera_on, session_room_presence.camera_on),
        mic_on = COALESCE(excluded.mic_on, session_room_presence.mic_on),
        screen_sharing = COALESCE(excluded.screen_sharing, session_room_presence.screen_sharing),
        status = COALESCE(excluded.status, session_room_presence.status),
        last_ping = CURRENT_TIMESTAMP
    `, [
      `pres-${sessionId}-${user.userId}`,
      sessionId,
      user.userId,
      displayName,
      role,
      cameraOn !== undefined ? Boolean(cameraOn) : true,
      micOn !== undefined ? Boolean(micOn) : true,
      screenSharing !== undefined ? Boolean(screenSharing) : false,
      status || 'CONNECTED',
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 });
  }
}
