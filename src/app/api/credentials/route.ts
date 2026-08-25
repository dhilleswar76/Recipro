import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId') || user.userId;

  const result = await query(`
    SELECT c.*, s.name as skill_name, s.category as skill_category, s.icon as skill_icon
    FROM credentials c
    LEFT JOIN skills s ON c.skill_id = s.id
    WHERE c.user_id = $1 AND c.is_revoked = FALSE
    ORDER BY c.issued_at DESC
  `, [targetUserId]);

  return NextResponse.json({ credentials: result.rows });
}
