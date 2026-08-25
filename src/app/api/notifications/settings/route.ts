import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { NotificationService } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  try {
    const preferences = await NotificationService.getUserPreferences(user.userId);
    return NextResponse.json({ preferences });
  } catch (err: any) {
    console.error('Fetch Notification Preferences Error:', err);
    return NextResponse.json({ error: 'Failed to fetch preferences', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  try {
    const body = await req.json();
    const preferences = await NotificationService.updateUserPreferences(user.userId, {
      inAppEnabled: body.in_app_enabled,
      emailEnabled: body.email_enabled,
      sessionUpdates: body.session_updates,
      mentorAvailable: body.mentor_available,
      credits: body.credits,
      system: body.system,
    });

    return NextResponse.json({ success: true, preferences });
  } catch (err: any) {
    console.error('Update Notification Preferences Error:', err);
    return NextResponse.json({ error: 'Failed to update preferences', details: err.message }, { status: 500 });
  }
}
