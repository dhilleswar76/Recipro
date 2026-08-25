import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireRole } from '@/lib/auth';
import { getSkillDemandAnalytics, findPotentialMentorsForSkill } from '@/lib/skill-gap';

export async function GET(req: NextRequest) {
  const authRes = await requireRole(req, ['MODERATOR', 'ADMIN']);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { searchParams } = new URL(req.url);
  const skillName = searchParams.get('skill');

  const demand = await getSkillDemandAnalytics();
  let potentialMentors: any[] = [];
  if (skillName) {
    potentialMentors = await findPotentialMentorsForSkill(skillName);
  }

  return NextResponse.json({
    demand,
    skillName,
    potentialMentors,
  });
}

export async function POST(req: NextRequest) {
  const authRes = await requireRole(req, ['MODERATOR', 'ADMIN']);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;

  try {
    const body = await req.json();
    const { targetUserId, requestedSkillName, reason } = body;

    if (!targetUserId || !requestedSkillName) {
      return NextResponse.json({ error: 'Missing targetUserId or requestedSkillName' }, { status: 400 });
    }

    const targetProfile = (await query<{ display_name: string }>('SELECT display_name FROM profiles WHERE user_id = $1', [targetUserId])).rows[0];

    // Send high-priority mentor invitation notification
    await query(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES ($1, $2, $3, $4, 'INFO', '/profile')
    `, [
      `notif-${Date.now()}`,
      targetUserId,
      `Campus Invitation: Teach "${requestedSkillName}"!`,
      `Students at your campus have high demand for "${requestedSkillName}". Based on your related coursework & expertise, campus moderators invite you to take a quick skill assessment to become a verified mentor and earn Skill Credits!`
    ]);

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, new_state)
      VALUES ($1, $2, 'INVITE_POTENTIAL_MENTOR', 'USER', $3, $4)
    `, [`audit-${Date.now()}`, user.userId, targetUserId, requestedSkillName]);

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${targetProfile?.display_name || 'student'} for skill "${requestedSkillName}"!`,
    });
  } catch (err: any) {
    console.error('Admin Demand Action Error:', err);
    return NextResponse.json({ error: 'Failed to send mentor invitation' }, { status: 500 });
  }
}
