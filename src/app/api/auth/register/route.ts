import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, isAcademicEmail } from '@/lib/db';
import { RegisterSchema } from '@/lib/validations';
import { hashPassword, signToken } from '@/lib/auth';
import { EmailService } from '@/lib/email-service';

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

    const { email, password, college, major, year } = parsed.data;
    const displayName = (parsed.data.name || parsed.data.displayName || 'Campus Member').trim();
    const cleanEmail = email.trim().toLowerCase();
    const userType = parsed.data.userType || 'TEACHER_LEARNER';
    const db = getDb();

    // Check if user already exists (case-insensitive)
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = await hashPassword(password);
    
    // Strict security rule: Public registration CANNOT grant ADMIN or MODERATOR role
    const userRole = 'STUDENT';
    const campusId = `STU-${Math.floor(100000 + Math.random() * 900000)}`;

    // Generate cryptographically secure email verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const isAcademic = isAcademicEmail(cleanEmail) ? 1 : 0;

    const tx = db.transaction(() => {
      // 1. Insert User with verification token and academic email flag
      db.prepare(`
        INSERT INTO users (
          id, email, password_hash, role, status, campus_id, user_type,
          email_verified, verification_token, verification_token_expires, is_academic_email
        ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, 0, ?, ?, ?)
      `).run(userId, cleanEmail, passwordHash, userRole, campusId, userType, verificationToken, tokenExpires, isAcademic);

      // 2. Insert Profile with default values
      db.prepare(`
        INSERT INTO profiles (
          id, user_id, display_name, college, major, year, is_verified_student, trust_score, teaching_preference
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 75.0, 'Anyone')
      `).run(`prof-${userId}`, userId, displayName, college || 'SkillSwap Campus', major || 'General Studies', year || 'Freshman');

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
        VALUES (?, ?, 'Welcome to SkillSwap Campus!', 'Please verify your email address to complete your profile setup and start exchanging skills.', 'INFO', '/verify-email')
      `).run(`notif-${Date.now()}`, userId);
    });

    tx();

    // Automatically dispatch account verification email via configured SMTP / API / Dev provider
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      await EmailService.sendVerificationEmail(db, {
        to: cleanEmail,
        displayName,
        verificationUrl,
        token: verificationToken,
        userId,
        expiresInHours: 24,
      });
    } catch (mailErr) {
      console.warn('[Register:EMAIL_DISPATCH_WARN]', mailErr);
    }

    const token = signToken({
      userId,
      email: cleanEmail,
      role: userRole,
      status: 'ACTIVE',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully. Please verify your email to continue.',
      user: {
        id: userId,
        email: cleanEmail,
        displayName,
        role: userRole,
        campusId,
        college: college || 'SkillSwap Campus',
        major: major || 'General Studies',
        year: year || 'Freshman',
        balance: 3,
        emailVerified: false,
        isAcademicEmail: Boolean(isAcademic),
      },
      token,
      verificationToken,
      nextStep: '/verify-email',
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
