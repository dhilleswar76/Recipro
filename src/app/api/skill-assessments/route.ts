import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { SubmitAssessmentSchema } from '@/lib/validations';
import { evaluateSkillAssessment } from '@/lib/skill-verification';
import { notifyLearnersOfNewMentor } from '@/lib/skill-gap';
import { generatePythonQuiz, sanitizeAssessmentForClient } from '@/lib/gemini';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skillName = searchParams.get('skillName') || 'Python';
  const proficiency = (searchParams.get('proficiency') || 'Intermediate') as any;

  try {
    // Generate Python assessment via Gemini AI provider (with local curated fallback)
    const quiz = await generatePythonQuiz({
      proficiency: ['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(proficiency) ? proficiency : 'Intermediate',
      questionCount: 10,
    });

    // Strip correctOption and explanation before sending to client
    const sanitized = sanitizeAssessmentForClient(quiz);

    return NextResponse.json({
      success: true,
      skillName,
      difficulty: sanitized.difficulty,
      provider: sanitized.provider,
      questionsCount: sanitized.questionsCount,
      questions: sanitized.questions,
    });
  } catch (err: any) {
    console.error('Skill assessment generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate assessment' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authRes = requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  const db = getDb();

  try {
    const body = await req.json();
    const parsed = SubmitAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid assessment submission payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { skillId, targetLevel, answers } = parsed.data;

    // Check attempt limits (Max 3 attempts per skill)
    const attemptsCount = (db.prepare(`
      SELECT COUNT(*) as count FROM skill_assessments
      WHERE user_id = ? AND skill_id = ?
    `).get(user.userId, skillId) as any)?.count || 0;

    if (attemptsCount >= 3) {
      const lastAttempt = db.prepare(`
        SELECT created_at FROM skill_assessments
        WHERE user_id = ? AND skill_id = ?
        ORDER BY created_at DESC LIMIT 1
      `).get(user.userId, skillId) as any;

      if (lastAttempt) {
        const lastTime = new Date(lastAttempt.created_at).getTime();
        const now = Date.now();
        const hoursPassed = (now - lastTime) / (1000 * 60 * 60);
        if (hoursPassed < 24) {
          return NextResponse.json({
            error: `Maximum attempts reached (3/3). Please wait ${Math.ceil(24 - hoursPassed)} hours for cooldown before retaking.`
          }, { status: 429 });
        }
      }
    }

    // Authoritative server-side evaluation
    const evaluation = evaluateSkillAssessment({
      userId: user.userId,
      skillId,
      requestedProficiency: targetLevel,
      answers,
    });

    // If verified, trigger automatic notifications to waiting learners
    if (evaluation.passed) {
      notifyLearnersOfNewMentor(user.userId, skillId);
    }

    return NextResponse.json({
      success: true,
      result: evaluation,
      passed: evaluation.passed,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      percentage: evaluation.percentage,
      verifiedLevel: evaluation.verifiedLevel,
      verificationStatus: evaluation.verificationStatus,
      feedback: evaluation.feedback,
      assessmentId: evaluation.assessmentId,
    });
  } catch (err: any) {
    console.error('Assessment Submission Error:', err);
    return NextResponse.json({ error: 'Failed to process skill assessment' }, { status: 500 });
  }
}
