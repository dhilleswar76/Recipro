import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';
import { CreateReportSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  try {
    const body = await req.json();
    const parsed = CreateReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid report details', details: parsed.error.format() }, { status: 400 });
    }

    const { reportedId, sessionId, reason, details } = parsed.data;

    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await query(`
      INSERT INTO reports (id, reporter_id, reported_id, session_id, reason, details, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'OPEN')
    `, [reportId, user.userId, reportedId, sessionId || null, reason, details]);

    return NextResponse.json({
      success: true,
      message: 'Report submitted to campus moderation queue. Our team reviews all incidents.',
      reportId,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Report Submit Error:', err);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
