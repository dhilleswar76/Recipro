import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/postgres';
import { requireRole } from '@/lib/auth';
import { notifyLearnersOfNewMentor } from '@/lib/skill-gap';

export async function GET(req: NextRequest) {
  const authRes = await requireRole(req, ['MODERATOR', 'ADMIN']);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  // Fetch all user skills with verification details
  const pendingSkillsResult = await query(`
    SELECT 
      us.*,
      s.name as skill_name, s.category as skill_category,
      p.display_name, p.college, p.major, p.year,
      u.email, u.campus_id,
      r.bayesian_rating, r.total_sessions_taught
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    JOIN users u ON us.user_id = u.id
    JOIN profiles p ON us.user_id = p.user_id
    LEFT JOIN reputations r ON us.user_id = r.user_id
    ORDER BY 
      CASE WHEN us.verification_status = 'SELF_DECLARED' THEN 1
           WHEN us.verification_status = 'ASSESSMENT_VERIFIED' THEN 2
           ELSE 3 END,
      us.created_at DESC
  `);

  const recentAssessmentsResult = await query(`
    SELECT 
      sa.*,
      s.name as skill_name,
      p.display_name, p.college
    FROM skill_assessments sa
    JOIN skills s ON sa.skill_id = s.id
    JOIN profiles p ON sa.user_id = p.user_id
    ORDER BY sa.created_at DESC
    LIMIT 20
  `);

  return NextResponse.json({
    skills: pendingSkillsResult.rows,
    assessments: recentAssessmentsResult.rows,
  });
}

export async function POST(req: NextRequest) {
  const authRes = await requireRole(req, ['MODERATOR', 'ADMIN']);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;

  try {
    const body = await req.json();
    const { userId, skillId, action, notes } = body; // action: 'APPROVE_PLATFORM_VERIFIED' | 'REQUEST_REASSESSMENT' | 'REJECT'

    if (!userId || !skillId || !action) {
      return NextResponse.json({ error: 'Missing userId, skillId, or action' }, { status: 400 });
    }

    const skill = (await query<{ name: string }>('SELECT name FROM skills WHERE id = $1', [skillId])).rows[0];
    const skillName = skill ? skill.name : 'Skill';

    let newStatus = 'SELF_DECLARED';
    let notifTitle = '';
    let notifMsg = '';

    if (action === 'APPROVE_PLATFORM_VERIFIED') {
      newStatus = 'PLATFORM_VERIFIED';
      notifTitle = `Skill Verified: ${skillName}`;
      notifMsg = `Congratulations! Your teaching proficiency in "${skillName}" has been officially Platform Verified by campus administrators.`;
    } else if (action === 'REQUEST_REASSESSMENT') {
      newStatus = 'VERIFICATION_FAILED';
      notifTitle = `Reassessment Requested: ${skillName}`;
      notifMsg = `Administrator note on your ${skillName} skill: ${notes || 'Please retake the skill assessment to demonstrate current proficiency.'}`;
    } else {
      newStatus = 'SELF_DECLARED';
      notifTitle = `Skill Review: ${skillName}`;
      notifMsg = `Administrator note: ${notes || 'Skill claim marked as self-declared.'}`;
    }

    await withTransaction(async (client) => {
      await client.query(`
      UPDATE user_skills
      SET 
        verification_status = $1,
        verified_at = CURRENT_TIMESTAMP,
        verified_by = $2,
        reassessment_required = CASE WHEN $3 = 'VERIFICATION_FAILED' THEN 1 ELSE 0 END
      WHERE user_id = $4 AND skill_id = $5
    `, [newStatus, user.userId, newStatus, userId, skillId]);

    // Audit log
      await client.query(`
      INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, new_state)
      VALUES ($1, $2, $3, 'USER_SKILL', $4, $5)
    `, [`audit-${Date.now()}`, user.userId, action, `${userId}:${skillId}`, newStatus]);

    // Notification
      await client.query(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES ($1, $2, $3, $4, 'CREDENTIAL_ISSUED', '/profile')
    `, [`notif-${Date.now()}`, userId, notifTitle, notifMsg]);
    });

    if (newStatus === 'PLATFORM_VERIFIED') {
      await notifyLearnersOfNewMentor(userId, skillId);
    }

    return NextResponse.json({
      success: true,
      message: `Skill status updated to ${newStatus}`,
      status: newStatus,
    });
  } catch (err: any) {
    console.error('Admin Verification Action Error:', err);
    return NextResponse.json({ error: 'Failed to process verification action' }, { status: 500 });
  }
}
