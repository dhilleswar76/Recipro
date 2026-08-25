import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { NotificationService } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  try {
    const unreadCount = await NotificationService.getUnreadCount(user.userId);
    return NextResponse.json({ unreadCount });
  } catch (err: any) {
    console.error('Fetch Unread Count Error:', err);
    return NextResponse.json({ unreadCount: 0 });
  }
}
