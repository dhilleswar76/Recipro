import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';
import { CreateSkillRequestSchema, SubscribeSkillNotificationSchema } from '@/lib/validations';
import { createSkillRequest, getSkillDemandAnalytics, findPotentialMentorsForSkill } from '@/lib/skill-gap';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const demandOnly = searchParams.get('demandOnly') === 'true';
  const querySkill = searchParams.get('skill');

  if (demandOnly) {
    const demand = await getSkillDemandAnalytics();
    return NextResponse.json({ demand });
  }

  if (querySkill) {
    const potential = await findPotentialMentorsForSkill(querySkill);
    return NextResponse.json({ skillName: querySkill, potentialMentors: potential });
  }

  const requestsResult = await query(`
    SELECT 
      sr.*,
      s.name as skill_name, s.category as skill_category,
      p.display_name as learner_name, p.college as learner_college, p.avatar as learner_avatar
    FROM skill_requests sr
    JOIN skills s ON sr.skill_id = s.id
    JOIN profiles p ON sr.learner_id = p.user_id
    WHERE sr.status = 'OPEN'
    ORDER BY sr.created_at DESC
    LIMIT 30
  `);
  const requests = requestsResult.rows;

  return NextResponse.json({ requests, demand: await getSkillDemandAnalytics() });
}

export async function POST(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;

  try {
    const body = await req.json();
    const action = body.action || 'CREATE_REQUEST';

    if (action === 'SUBSCRIBE') {
      const parsed = SubscribeSkillNotificationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid subscription data', details: parsed.error.format() }, { status: 400 });
      }

      const skillResult = await query('SELECT id FROM skills WHERE LOWER(name) = LOWER($1)', [parsed.data.skillName]);
      let skill = skillResult.rows[0] as { id: string } | undefined;
      if (!skill) {
        const skillId = `skill-${parsed.data.skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        await query(`
          INSERT INTO skills (id, name, category, icon, description)
          VALUES (?, ?, ?, 'BookOpen', 'Student requested topic')
        `, [skillId, parsed.data.skillName, parsed.data.category]);
        skill = { id: skillId };
      }

      await query(`
        INSERT INTO skill_subscriptions (id, user_id, skill_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, skill_id) DO NOTHING
      `, [`sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, user.userId, skill.id]);

      return NextResponse.json({
        success: true,
        message: `Subscribed! You will be notified the instant a mentor becomes verified in "${parsed.data.skillName}".`,
      });
    }

    const parsed = CreateSkillRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request data', details: parsed.error.format() }, { status: 400 });
    }

    const result = await createSkillRequest({
      learnerId: user.userId,
      skillName: parsed.data.skillName,
      category: parsed.data.category,
      requestedProficiency: parsed.data.requestedProficiency,
      currentProficiency: parsed.data.currentProficiency,
      learningGoal: parsed.data.learningGoal,
      preferredSchedule: parsed.data.preferredSchedule,
      preferredSessionMode: parsed.data.preferredSessionMode,
      urgency: parsed.data.urgency,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('Skill Request API Error:', err);
    return NextResponse.json({ error: 'Failed to process skill request' }, { status: 500 });
  }
}
