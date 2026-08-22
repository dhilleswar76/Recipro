import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, isAcademicEmail } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/auth/verify-email?token=xyz
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token || !token.trim()) {
    return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
  }

  const db = getDb();

  try {
    const user = db.prepare(`
      SELECT id, email, email_verified, verification_token_expires, is_academic_email
      FROM users
      WHERE verification_token = ?
    `).get(token.trim()) as any;

    if (!user) {
      return NextResponse.json({ error: 'This verification link is invalid or has already been used.' }, { status: 400 });
    }

    if (user.verification_token_expires && new Date(user.verification_token_expires).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This verification link has expired. Please request a new verification email.' }, { status: 400 });
    }

    // Invalidate token and mark email_verified = 1
    db.prepare(`
      UPDATE users 
      SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(user.id);

    // Record verified event in notifications
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, 'Email Verified Successfully', 'Your email address has been verified. You can now complete your onboarding.', 'INFO', '/onboarding')
    `).run(`notif-verify-${Date.now()}`, user.id);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      isAcademicEmail: Boolean(user.is_academic_email),
    });
  } catch (err: any) {
    console.error('Verify Email Error:', err);
    return NextResponse.json({ error: 'Failed to verify email address' }, { status: 500 });
  }
}

// POST /api/auth/verify-email/resend
export async function POST(req: NextRequest) {
  const authRes = requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const db = getDb();

  try {
    const freshToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      UPDATE users
      SET verification_token = ?, verification_token_expires = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(freshToken, tokenExpires, user.userId);

    return NextResponse.json({
      success: true,
      message: 'New verification email dispatched successfully.',
      verificationToken: freshToken,
    });
  } catch (err: any) {
    console.error('Resend Verification Error:', err);
    return NextResponse.json({ error: 'Failed to resend verification email' }, { status: 500 });
  }
}
