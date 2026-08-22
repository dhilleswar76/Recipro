import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authRes = requireAuth(req);
  if ('errorResponse' in authRes) {
    return authRes.errorResponse;
  }

  const { user } = authRes;
  const db = getDb();

  const fullUser = db.prepare(`
    SELECT 
      u.id, u.email, u.role, u.status, u.campus_id,
      p.display_name, p.avatar, p.bio, p.college, p.major, p.year,
      p.is_verified_student, p.trust_score, p.completion_rate, p.cancellation_rate,
      p.hourly_rate_credits, p.teaching_style, p.languages, p.profile_visibility,
      acc.balance, acc.escrow_balance, acc.lifetime_earned, acc.lifetime_spent,
      r.bayesian_rating, r.total_reviews, r.total_sessions_taught, r.total_sessions_learned, r.reliability_score,
      w.address as wallet_address, w.is_verified as wallet_verified
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    LEFT JOIN skill_credit_accounts acc ON u.id = acc.user_id
    LEFT JOIN reputations r ON u.id = r.user_id
    LEFT JOIN wallets w ON u.id = w.user_id
    WHERE u.id = ?
  `).get(user.userId) as any;

  if (!fullUser) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  // Fetch teaching skills
  const skills = db.prepare(`
    SELECT us.*, s.name as skill_name, s.category as skill_category, s.icon
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    WHERE us.user_id = ?
  `).all(user.userId);

  // Fetch learning goals
  const goals = db.prepare(`
    SELECT lg.*, s.name as skill_name, s.category as skill_category
    FROM learning_goals lg
    JOIN skills s ON lg.skill_id = s.id
    WHERE lg.user_id = ?
  `).all(user.userId);

  // Fetch unread notifications count
  const unreadNotifs = (db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
  `).get(user.userId) as any).count;

  return NextResponse.json({
    user: {
      ...fullUser,
      is_verified_student: Boolean(fullUser.is_verified_student),
      skills,
      goals,
      unreadNotificationsCount: unreadNotifs,
    }
  });
}
