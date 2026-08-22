import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { BookSessionSchema } from '@/lib/validations';
import { reserveEscrowCredits } from '@/lib/state-machine';
import { checkSlotHardConstraints } from '@/lib/scheduling';

export async function GET(req: NextRequest) {
  const authRes = requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const db = getDb();

  // Fetch sessions where user is teacher OR learner
  const sessions = db.prepare(`
    SELECT 
      s.*,
      sk.name as skill_name, sk.category as skill_category, sk.icon as skill_icon,
      tp.display_name as teacher_name, tp.avatar as teacher_avatar, tp.college as teacher_college,
      lp.display_name as learner_name, lp.avatar as learner_avatar, lp.college as learner_college,
      r.id as rating_id, r.score as rating_score
    FROM sessions s
    JOIN skills sk ON s.skill_id = sk.id
    JOIN profiles tp ON s.teacher_id = tp.user_id
    JOIN profiles lp ON s.learner_id = lp.user_id
    LEFT JOIN ratings r ON s.id = r.session_id AND r.rater_id = ?
    WHERE s.teacher_id = ? OR s.learner_id = ?
    ORDER BY s.scheduled_start DESC
  `).all(user.userId, user.userId, user.userId);

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const authRes = requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const db = getDb();

  try {
    const body = await req.json();
    const parsed = BookSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid booking data', details: parsed.error.format() }, { status: 400 });
    }

    const { teacherId, skillId, title, scheduledStart, scheduledEnd, durationHours, creditsAmount, mode, notes } = parsed.data;

    if (teacherId === user.userId) {
      return NextResponse.json({ error: 'You cannot book a skill session with yourself' }, { status: 400 });
    }

    // Verify teacher exists and teaches this skill
    const teacherSkill = db.prepare(`
      SELECT us.id, us.verification_status FROM user_skills us WHERE us.user_id = ? AND us.skill_id = ?
    `).get(teacherId, skillId) as { id: string; verification_status: string } | undefined;

    if (!teacherSkill) {
      return NextResponse.json({ error: 'The selected mentor does not teach this skill' }, { status: 400 });
    }

    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = `book-${sessionId}`;

    // Execute atomic booking transaction with hard scheduling constraint check
    let conflictResult: { hasConflict: boolean; reason?: string; nextAvailableSlot?: string } = { hasConflict: false };

    const bookingTx = db.transaction(() => {
      // 1. Check Hard Constraints atomically inside transaction
      conflictResult = checkSlotHardConstraints(db, {
        teacherId,
        learnerId: user.userId,
        scheduledStart,
        scheduledEnd,
        bufferMinutes: 15,
      });

      if (conflictResult.hasConflict) {
        return; // Abort booking transaction
      }

      // 2. Reserve Learner Escrow Credits
      const escrowRes = reserveEscrowCredits(user.userId, creditsAmount, sessionId, idempotencyKey);
      if (!escrowRes.success) {
        throw new Error(`INSUFFICIENT_CREDITS:${escrowRes.message}`);
      }

      // 3. Insert Session Record
      const meetingUrl = `https://meet.skillswap.internal/room/${sessionId}`;
      db.prepare(`
        INSERT INTO sessions (
          id, title, skill_id, teacher_id, learner_id, status, scheduled_start, scheduled_end, duration_hours, credits_amount, mode, location_or_url, idempotency_key, notes
        ) VALUES (?, ?, ?, ?, ?, 'REQUESTED', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sessionId,
        title,
        skillId,
        teacherId,
        user.userId,
        scheduledStart,
        scheduledEnd,
        durationHours,
        creditsAmount,
        mode,
        meetingUrl,
        idempotencyKey,
        notes || ''
      );

      // 4. Notify Teacher
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'New Session Request!', ?, 'SESSION_REQUEST', '/sessions')
      `).run(
        `notif-${Date.now()}`,
        teacherId,
        `A student requested a ${durationHours}h session for your skill: "${title}"`
      );
    });

    try {
      bookingTx();
    } catch (txErr: any) {
      if (txErr.message.startsWith('INSUFFICIENT_CREDITS:')) {
        return NextResponse.json({ error: txErr.message.replace('INSUFFICIENT_CREDITS:', '') }, { status: 402 });
      }
      throw txErr;
    }

    if (conflictResult.hasConflict) {
      return NextResponse.json({
        error: conflictResult.reason || 'Scheduling conflict: that slot is unavailable.',
        code: 'SLOT_CONFLICT',
        nextAvailableSlot: conflictResult.nextAvailableSlot,
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session requested! 1 Skill Credit held in escrow until completion.',
      session: {
        id: sessionId,
        status: 'REQUESTED',
        creditsAmount,
        meetingUrl: `https://meet.skillswap.internal/room/${sessionId}`,
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error('Book Session Error:', err);
    return NextResponse.json({ error: 'Failed to create session request' }, { status: 500 });
  }
}

