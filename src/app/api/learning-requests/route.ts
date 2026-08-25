import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createLearningRequest, getLearningRequestsForUser } from '@/lib/learning-requests';
import { query } from '@/lib/postgres';

export async function GET(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  try {
    const requests = await getLearningRequestsForUser(user.userId);
    return NextResponse.json({ requests });
  } catch (err: any) {
    console.error('Fetch learning requests error:', err);
    return NextResponse.json({ error: 'Failed to retrieve learning requests', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  try {
    const body = await req.json();
    const skillName = (body.skillName || '').trim();
    if (!skillName) {
      return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
    }

    // Duplicate open request guard for the same skill
    const existingOpenResult = await query(`
      SELECT id FROM learning_requests 
      WHERE learner_id = $1 AND LOWER(skill_name) = LOWER($2) AND status IN ('OPEN', 'MENTOR_FOUND', 'NOTIFIED')
    `, [user.userId, skillName]);
    const existingOpen = existingOpenResult.rows[0];

    if (existingOpen) {
      return NextResponse.json({
        success: true,
        alreadyActive: true,
        message: `You already have an active request for "${skillName}". We'll notify you as soon as a mentor becomes available!`,
        request: existingOpen,
      }, { status: 200 });
    }

    const request = await createLearningRequest({
      learnerId: user.userId,
      skillName,
      category: body.category || 'Computer Science',
      requestedProficiency: body.requestedProficiency || 'Beginner',
      preferredDays: Array.isArray(body.preferredDays) ? body.preferredDays : ['Tuesday', 'Thursday'],
      preferredTimeStart: body.preferredTimeStart || '17:00',
      preferredTimeEnd: body.preferredTimeEnd || '20:00',
      durationHours: Number(body.durationHours) || 1.0,
      learningGoal: body.learningGoal || `Learn ${skillName}`,
      searchScope: body.searchScope || 'ALL',
    });

    return NextResponse.json({
      success: true,
      message: `Learning request for ${skillName} created! We'll notify you when a suitable mentor becomes available.`,
      request,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Create learning request error:', err);
    return NextResponse.json({ error: 'Failed to create learning request', details: err.message }, { status: 500 });
  }
}
