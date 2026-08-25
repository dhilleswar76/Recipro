import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const sessionId = params.id;
  try {
    const padResult = await query(`
      SELECT * FROM session_scratchpads WHERE session_id = $1
    `, [sessionId]);
    const pad = padResult.rows[0] as any;

    if (!pad) {
      const defaultContent = `// SkillSwap Campus Live Collaborative Scratchpad\n// Topic: Mentoring Session Interactive Workspace\n\nfunction startSession() {\n  console.log("Welcome to your live SkillSwap peer classroom!");\n}\n`;
      return NextResponse.json({
        content: defaultContent,
        language: 'javascript',
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      content: pad.content,
      language: pad.language,
      updatedBy: pad.updated_by,
      updatedAt: pad.updated_at,
    });
  } catch (err: any) {
    const defaultContent = `// SkillSwap Campus Live Collaborative Scratchpad\n// Topic: Mentoring Session Interactive Workspace\n\nfunction startSession() {\n  console.log("Welcome to your live SkillSwap peer classroom!");\n}\n`;
    return NextResponse.json({
      content: defaultContent,
      language: 'javascript',
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const sessionId = params.id;
  try {
    const body = await req.json();
    const { content, language } = body;

    await query(`
      INSERT INTO session_scratchpads (id, session_id, content, language, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT(session_id) DO UPDATE SET
        content = excluded.content,
        language = COALESCE(excluded.language, session_scratchpads.language),
        updated_by = excluded.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `, [
      `pad-${sessionId}`,
      sessionId,
      content || '',
      language || 'javascript',
      user.userId,
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save scratchpad' }, { status: 500 });
  }
}
