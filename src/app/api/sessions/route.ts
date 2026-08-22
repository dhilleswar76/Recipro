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

  try {
    // Fetch sessions where user is teacher OR learner with resilient LEFT JOINs
    const sessions = db.prepare(`
      SELECT 
        s.*,
        sk.name as skill_name, sk.category as skill_category, sk.icon as skill_icon,
        COALESCE(tp.display_name, 'Teacher') as teacher_name, tp.avatar as teacher_avatar, tp.college as teacher_college,
        COALESCE(lp.display_name, 'Learner') as learner_name, lp.avatar as learner_avatar, lp.college as learner_college,
        r.id as rating_id, r.score as rating_score,
        sea.id as agreement_id,
        sea.requested_return_skill_name as agreement_return_skill,
        sea.return_type as agreement_return_type,
        sea.credit_amount as agreement_credit_amount,
        sea.status as agreement_status,
        sea.proposed_by as agreement_proposed_by
      FROM sessions s
      LEFT JOIN skills sk ON s.skill_id = sk.id
      LEFT JOIN profiles tp ON s.teacher_id = tp.user_id
      LEFT JOIN profiles lp ON s.learner_id = lp.user_id
      LEFT JOIN session_exchange_agreements sea ON s.id = sea.session_id
      LEFT JOIN ratings r ON s.id = r.session_id AND r.rater_id = ?
      WHERE s.teacher_id = ? OR s.learner_id = ?
      ORDER BY s.scheduled_start DESC
    `).all(user.userId, user.userId, user.userId);

    return NextResponse.json({ sessions });
  } catch (err: any) {
    console.error('Fetch Sessions Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve sessions', details: err.message }, { status: 500 });
  }
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

    // Pre-check learner credit balance
    const account = db.prepare(`
      SELECT balance FROM skill_credit_accounts WHERE user_id = ?
    `).get(user.userId) as { balance: number } | undefined;

    if (!account || account.balance < creditsAmount) {
      return NextResponse.json({ 
        error: `Insufficient Skill Credits. You have ${account?.balance || 0} credits, but ${creditsAmount} is required.` 
      }, { status: 402 });
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

      // 2. Insert Session Record FIRST (Satisfies Foreign Key constraints for subsequent credit transactions)
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

      // 2b. Insert Session Participants (Explicit Session Roles)
      db.prepare(`
        INSERT OR IGNORE INTO session_participants (id, session_id, user_id, session_role, confirmed)
        VALUES (?, ?, ?, 'TRAINER', 0), (?, ?, ?, 'LEARNER', 0)
      `).run(
        `sp-${sessionId}-trainer`,
        sessionId,
        teacherId,
        `sp-${sessionId}-learner`,
        sessionId,
        user.userId
      );

      // 3. Reserve Learner Escrow Credits (Now references existing sessionId)
      const escrowRes = reserveEscrowCredits(user.userId, creditsAmount, sessionId, idempotencyKey);
      if (!escrowRes.success) {
        throw new Error(`INSUFFICIENT_CREDITS:${escrowRes.message}`);
      }

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
    return NextResponse.json({ error: 'Failed to create session request', details: err.message }, { status: 500 });
  }
}
