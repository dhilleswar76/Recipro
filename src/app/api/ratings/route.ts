import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';
import { SubmitRatingSchema } from '@/lib/validations';
import { refreshUserReputation } from '@/lib/reputation';
import { scanAndRecordFraudAlert } from '@/lib/fraud-detector';

export async function POST(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;

  try {
    const body = await req.json();
    const parsed = SubmitRatingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid rating submission', details: parsed.error.format() }, { status: 400 });
    }

    const { sessionId, score, review, punctualityScore, clarityScore, skillsDemonstrated } = parsed.data;

    // Verify session
    const session = (await query(`SELECT * FROM sessions WHERE id = $1`, [sessionId])).rows[0] as any;
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.teacher_id !== user.userId && session.learner_id !== user.userId) {
      return NextResponse.json({ error: 'You were not a participant in this session' }, { status: 403 });
    }

    const rateeId = session.teacher_id === user.userId ? session.learner_id : session.teacher_id;

    // Check if rating already submitted
    const existing = (await query(`SELECT id FROM ratings WHERE session_id = $1 AND rater_id = $2`, [sessionId, user.userId])).rows[0];
    if (existing) {
      return NextResponse.json({ error: 'You have already submitted a rating for this session' }, { status: 409 });
    }

    const ratingId = `rat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await query(`
      INSERT INTO ratings (
        id, session_id, rater_id, ratee_id, score, review, punctuality_score, clarity_score, skills_demonstrated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      ratingId,
      sessionId,
      user.userId,
      rateeId,
      score,
      review,
      punctualityScore,
      clarityScore,
      skillsDemonstrated || ''
    ]);

    // Refresh ratee Bayesian reputation and reliability metrics
    const updatedRep = await refreshUserReputation(rateeId);

    // Check for fraud/reciprocity anomalies
    await scanAndRecordFraudAlert(user.userId);
    await scanAndRecordFraudAlert(rateeId);

    return NextResponse.json({
      success: true,
      message: 'Rating and review recorded successfully! Peer reputation updated.',
      updatedReputation: updatedRep,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Submit Rating Error:', err);
    return NextResponse.json({ error: 'Failed to record rating' }, { status: 500 });
  }
}
