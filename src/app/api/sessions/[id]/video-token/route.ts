import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { authorizeSessionParticipant, recordAttendanceEvent } from '@/lib/video-session';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const sessionId = params.id;

  try {
    const authResult = await authorizeSessionParticipant(sessionId, user.userId);

    if (!authResult.authorized) {
      return NextResponse.json({
        authorized: false,
        error: authResult.error || 'Access denied: You are not authorized to join this video session.',
      }, { status: 403 });
    }

    // Record participant JOIN event telemetry
    await recordAttendanceEvent(sessionId, user.userId, 'JOINED', {
      role: authResult.role,
      userAgent: req.headers.get('user-agent') || 'Browser Client',
    });

    return NextResponse.json({
      authorized: true,
      sessionId: authResult.sessionId,
      userId: authResult.userId,
      displayName: authResult.displayName,
      role: authResult.role,
      sessionTitle: authResult.sessionTitle,
      skillName: authResult.skillName,
      videoToken: authResult.token,
      mode: authResult.isOnline ? 'ONLINE' : 'CAMPUS_IN_PERSON',
      sessionStatus: authResult.status,
    });
  } catch (err: any) {
    console.error('Video token generation error:', err);
    return NextResponse.json({ error: 'Failed to authorize video session' }, { status: 500 });
  }
}
