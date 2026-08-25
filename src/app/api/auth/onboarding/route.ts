import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';
import { OnboardingSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  try {
    const body = await req.json();
    const parsed = OnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid onboarding fields', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { userType, college, major, year, teachingPreference, bio } = parsed.data;

    await withTransaction(async (client) => {
      // 1. Update user capability (user_type)
      await client.query(`
        UPDATE users 
        SET user_type = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [userType, user.userId]);

      // 2. Update profile details
      await client.query(`
        UPDATE profiles 
        SET college = $1, major = $2, year = $3, teaching_preference = $4, bio = COALESCE($5, bio), updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $6
      `, [college, major, year, teachingPreference, bio || null, user.userId]);
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully!',
      userType,
      college,
      major,
      year,
    });
  } catch (err: any) {
    console.error('Onboarding API Error:', err.message || err);
    return NextResponse.json({ error: err.message || 'Failed to complete onboarding' }, { status: 500 });
  }
}
