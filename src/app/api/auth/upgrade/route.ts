import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  try {
    const existingResult = await query('SELECT id, role, user_type FROM users WHERE id = $1', [user.userId]);
    const existingUser = existingResult.rows[0] as any;
    if (!existingUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    if (existingUser.role === 'ADMIN' || existingUser.role === 'MODERATOR') {
      return NextResponse.json({ error: 'Administrative accounts cannot use student upgrade flow' }, { status: 400 });
    }

    const previousType = existingUser.user_type || 'TEACHER_LEARNER';

    // Upgrade user_type to TEACHER_LEARNER
    await withTransaction(async (client) => {
      await client.query(`
      UPDATE users
      SET user_type = 'TEACHER_LEARNER', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `, [user.userId]);

    // Record audit log
      await client.query(`
      INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, previous_state, new_state)
      VALUES (?, ?, 'ROLE_UPGRADE', 'USER', ?, ?, 'TEACHER_LEARNER')
      `, [`audit-${Date.now()}`, user.userId, user.userId, previousType]);

    // Insert user notification
      await client.query(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, 'Profile Upgraded to Mentor + Student', 'You can now both teach skills to earn credits and book peer learning sessions!', 'INFO', '/profile')
      `, [`notif-${Date.now()}`, user.userId]);
    });

    return NextResponse.json({
      success: true,
      message: 'Account successfully upgraded to Mentor + Student',
      userType: 'TEACHER_LEARNER',
    });
  } catch (err: any) {
    console.error('Upgrade API Error:', err);
    return NextResponse.json({ error: 'Failed to process role upgrade' }, { status: 500 });
  }
}
