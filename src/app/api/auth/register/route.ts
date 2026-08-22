import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { RegisterSchema } from '@/lib/validations';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password, displayName, college, major, year, role } = parsed.data;
    const db = getDb();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = await hashPassword(password);
    const userRole = role || 'STUDENT';
    const campusId = `STU-${Math.floor(100000 + Math.random() * 900000)}`;

    const tx = db.transaction(() => {
      // 1. Insert User
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, status, campus_id)
        VALUES (?, ?, ?, ?, 'ACTIVE', ?)
      `).run(userId, email, passwordHash, userRole, campusId);

      // 2. Insert Profile
      db.prepare(`
        INSERT INTO profiles (
          id, user_id, display_name, college, major, year, is_verified_student, trust_score
        ) VALUES (?, ?, ?, ?, ?, ?, 1, 75.0)
      `).run(`prof-${userId}`, userId, displayName, college, major, year);

      // 3. Insert Skill Credit Account with 3 starter credits
      db.prepare(`
        INSERT INTO skill_credit_accounts (id, user_id, balance, escrow_balance, lifetime_earned, lifetime_spent)
        VALUES (?, ?, 3, 0, 0, 0)
      `).run(`acc-${userId}`, userId);

      // 4. Insert Initial Reputation
      db.prepare(`
        INSERT INTO reputations (id, user_id, total_reviews, total_sessions_taught, total_sessions_learned, bayesian_rating, reliability_score)
        VALUES (?, ?, 0, 0, 0, 4.5, 95.0)
      `).run(`rep-${userId}`, userId);

      // 5. Welcome Notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Welcome to SkillSwap Campus!', 'You received 3 Starter Skill Credits. Explore skills or list what you can teach to earn more.', 'INFO', '/explore')
      `).run(`notif-${Date.now()}`, userId);
    });

    tx();

    const token = signToken({
      userId,
      email,
      role: userRole,
      status: 'ACTIVE',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully with 3 Starter Skill Credits',
      user: {
        id: userId,
        email,
        displayName,
        role: userRole,
        campusId,
        college,
        major,
        year,
        balance: 3,
      },
      token,
    }, { status: 201 });

    response.cookies.set('skillswap_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Register API Error:', err);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
