import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';
import { AddSkillSchema } from '@/lib/validations';
import { notifyLearnersOfNewMentor } from '@/lib/skill-gap';
import { evaluateActiveLearningRequests } from '@/lib/learning-requests';

export async function GET() {
  const result = await query('SELECT * FROM skills ORDER BY category, name');
  return NextResponse.json({ skills: result.rows });
}

export async function POST(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;

  try {
    const body = await req.json();
    const parsed = AddSkillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid skill data', details: parsed.error.format() }, { status: 400 });
    }

    const { skillName, category, proficiency, experienceYears, teachingStyle, evidenceUrl } = parsed.data;
    const initialStatus = parsed.data.verificationStatus || 'SELF_DECLARED';

    // Ensure user participation type allows teaching (convert LEARNER to TEACHER_LEARNER)
    const currentUser = (await query<{ user_type: string }>('SELECT user_type FROM users WHERE id = $1', [user.userId])).rows[0];
    if (currentUser?.user_type === 'LEARNER') {
      await query("UPDATE users SET user_type = 'TEACHER_LEARNER' WHERE id = $1", [user.userId]);
    }

    // Find or create skill in catalog
    let skill = (await query<{ id: string }>('SELECT id FROM skills WHERE LOWER(name) = LOWER($1)', [skillName])).rows[0];
    if (!skill) {
      const skillId = `skill-${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      await query(`
        INSERT INTO skills (id, name, category, icon, description)
        VALUES ($1, $2, $3, 'BookOpen', 'Student added skill capability')
      `, [skillId, skillName, category]);
      skill = { id: skillId };
    }

    const teachingDays = body.teachingDays ? JSON.stringify(body.teachingDays) : '["Monday","Wednesday","Friday"]';
    const availableStartTime = body.availableStartTime || '17:00';
    const availableEndTime = body.availableEndTime || '20:00';
    const preferredStartTime = body.preferredStartTime || '18:00';
    const preferredEndTime = body.preferredEndTime || '20:00';
    const sessionDurationMinutes = Number(body.sessionDurationMinutes) || 60;
    const timezone = body.timezone || 'Asia/Kolkata';
    const isFlexible = body.isFlexible === false ? 0 : 1;

    if (body.teachingPreference) {
      await query('UPDATE profiles SET teaching_preference = $1 WHERE user_id = $2', [body.teachingPreference, user.userId]);
    }

    // Insert or update user skill
    await query(`
      INSERT INTO user_skills (
        id, user_id, skill_id, proficiency, experience_years, teaching_style, verification_status, evidence_url,
        teaching_days, available_start_time, available_end_time, preferred_start_time, preferred_end_time,
        session_duration_minutes, timezone, is_flexible
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT(user_id, skill_id) DO UPDATE SET
        proficiency = excluded.proficiency,
        experience_years = excluded.experience_years,
        teaching_style = excluded.teaching_style,
        verification_status = excluded.verification_status,
        evidence_url = excluded.evidence_url,
        teaching_days = excluded.teaching_days,
        available_start_time = excluded.available_start_time,
        available_end_time = excluded.available_end_time,
        preferred_start_time = excluded.preferred_start_time,
        preferred_end_time = excluded.preferred_end_time,
        session_duration_minutes = excluded.session_duration_minutes,
        timezone = excluded.timezone,
        is_flexible = excluded.is_flexible
    `, [
      `usk-${user.userId}-${skill.id}`,
      user.userId,
      skill.id,
      proficiency,
      experienceYears,
      teachingStyle || 'Hands-on practice',
      initialStatus,
      evidenceUrl || null,
      teachingDays,
      availableStartTime,
      availableEndTime,
      preferredStartTime,
      preferredEndTime,
      sessionDurationMinutes,
      timezone,
      isFlexible
    ]);

    if (initialStatus === 'PLATFORM_VERIFIED' || initialStatus === 'ASSESSMENT_VERIFIED') {
      await notifyLearnersOfNewMentor(user.userId, skill.id);
      await evaluateActiveLearningRequests({ triggerSkillId: skill.id });
    }

    return NextResponse.json({
      success: true,
      message: `Skill "${skillName}" added! Marked as 🟠 Verification Pending until assessment is completed.`,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Add Skill Error:', err);
    return NextResponse.json({ error: 'Failed to add skill' }, { status: 500 });
  }
}

