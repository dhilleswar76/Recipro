import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDailyReport, logAdminAction } from '@/lib/admin-reporting';

export async function GET(req: NextRequest) {
  const authRes = await requireAdmin(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date') || new Date().toISOString().substring(0, 10);

  // Validate date format (YYYY-MM-DD or ALL)
  if (dateStr !== 'ALL' && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD or ALL' }, { status: 400 });
  }

  try {
    const report = await getDailyReport(dateStr);
    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Daily report generation error:', err);
    return NextResponse.json({ error: 'Failed to generate daily report' }, { status: 500 });
  }
}
