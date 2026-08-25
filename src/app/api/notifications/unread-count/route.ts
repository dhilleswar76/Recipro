import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { NotificationService } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const authRes = await requireAuth(req);
    if ('errorResponse' in authRes) return NextResponse.json({ unreadCount: 0 });

    const { user } = authRes;
    const unreadCount = await NotificationService.getUnreadCount(user.userId);
    return NextResponse.json({ unreadCount });
  } catch (err: any) {
    return NextResponse.json({ unreadCount: 0 });
  }
}
