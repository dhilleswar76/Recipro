import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';
import { SubmitAssessmentSchema } from '@/lib/validations';
import { evaluateSkillAssessment } from '@/lib/skill-verification';
import { notifyLearnersOfNewMentor } from '@/lib/skill-gap';
import { evaluateActiveLearningRequests } from '@/lib/learning-requests';
import { generateSkillAssessment, sanitizeAssessmentForClient } from '@/lib/gemini';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skillName = searchParams.get('skillName') || 'Python';
  const proficiency = (searchParams.get('proficiency') || 'Intermediate') as any;

  try {
    // Generate skill-specific assessment via Gemini AI provider (with local curated fallback per skill)
    const quiz = await generateSkillAssessment({
      skillName,
      proficiency: ['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(proficiency) ? proficiency : 'Intermediate',
      questionCount: 5,
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
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;

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

    // Check attempt limits (Max 3 attempts per skill within a 24-hour rolling window)
    const recentAttempts = (await query(`
      SELECT created_at FROM skill_assessments
      WHERE user_id = $1 AND skill_id = $2
      ORDER BY created_at DESC LIMIT 3
    `, [user.userId, skillId])).rows as any[];

    if (recentAttempts.length >= 3) {
      const thirdRecent = recentAttempts[2];
      const thirdTime = new Date(thirdRecent.created_at).getTime();
      const now = Date.now();
      const hoursPassed = (now - thirdTime) / (1000 * 60 * 60);
      if (hoursPassed < 24) {
        return NextResponse.json({
          error: `Maximum attempts reached (3 attempts per 24 hours). Please wait ${Math.ceil(24 - hoursPassed)} hours for cooldown before retaking.`
        }, { status: 429 });
      }
    }

    // Authoritative server-side evaluation
    const evaluation = await evaluateSkillAssessment({
      userId: user.userId,
      skillId,
      requestedProficiency: targetLevel,
      answers,
    });

    // If verified, trigger automatic notifications to waiting learners
    if (evaluation.passed) {
      await notifyLearnersOfNewMentor(user.userId, skillId);
      await evaluateActiveLearningRequests({ triggerSkillId: skillId });
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
