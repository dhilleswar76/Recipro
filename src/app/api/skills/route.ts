import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { AddSkillSchema } from '@/lib/validations';

export async function GET() {
  const db = getDb();
  const skills = db.prepare('SELECT * FROM skills ORDER BY category, name').all();
  return NextResponse.json({ skills });
}

export async function POST(req: NextRequest) {
  const authRes = requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const db = getDb();

  try {
    const body = await req.json();
    const parsed = AddSkillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid skill data', details: parsed.error.format() }, { status: 400 });
    }

    const { skillName, category, proficiency, experienceYears, teachingStyle, evidenceUrl, verificationStatus } = parsed.data;

    // Find or create skill in catalog
    let skill = db.prepare('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)').get(skillName) as { id: string } | undefined;
    if (!skill) {
      const skillId = `skill-${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      db.prepare(`
        INSERT INTO skills (id, name, category, icon, description)
        VALUES (?, ?, ?, 'BookOpen', 'Student added skill capability')
      `).run(skillId, skillName, category);
      skill = { id: skillId };
    }

    // Insert or update user skill
    db.prepare(`
      INSERT INTO user_skills (
        id, user_id, skill_id, proficiency, experience_years, teaching_style, verification_status, evidence_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, skill_id) DO UPDATE SET
        proficiency = excluded.proficiency,
        experience_years = excluded.experience_years,
        teaching_style = excluded.teaching_style,
        verification_status = excluded.verification_status,
        evidence_url = excluded.evidence_url
    `).run(
      `usk-${user.userId}-${skill.id}`,
      user.userId,
      skill.id,
      proficiency,
      experienceYears,
      teachingStyle || 'Hands-on practice',
      verificationStatus || 'CLAIMED',
      evidenceUrl || null
    );

    return NextResponse.json({
      success: true,
      message: `Skill "${skillName}" added to your teaching profile!`,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Add Skill Error:', err);
    return NextResponse.json({ error: 'Failed to add skill' }, { status: 500 });
  }
}
