import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { NotificationService } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  try {
    const updatedCount = await NotificationService.markAllAsRead(user.userId);
    return NextResponse.json({ success: true, updatedCount });
  } catch (err: any) {
    console.error('Mark All Notifications Read Error:', err);
    return NextResponse.json({ error: 'Failed to update notifications', details: err.message }, { status: 500 });
  }
}
