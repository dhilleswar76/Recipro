import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { SubmitAssessmentSchema } from '@/lib/validations';
import { getAssessmentQuestionsForSkill, evaluateSkillAssessment } from '@/lib/skill-verification';
import { notifyLearnersOfNewMentor } from '@/lib/skill-gap';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skillName = searchParams.get('skillName') || 'Python';
  const questions = getAssessmentQuestionsForSkill(skillName);

  // Return questions without the correct answers so frontend cannot cheat
  const sanitized = questions.map(q => ({
    id: q.id,
    question: q.question,
    codeSnippet: q.codeSnippet,
    options: q.options,
    level: q.level,
  }));

  return NextResponse.json({
    skillName,
    questionsCount: sanitized.length,
    questions: sanitized,
  });
}

export async function POST(req: NextRequest) {
  const authRes = requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;

  try {
    const body = await req.json();
    const parsed = SubmitAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid assessment submission', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { skillId, targetLevel, answers } = parsed.data;

    const evaluation = evaluateSkillAssessment({
      userId: user.userId,
      skillId,
      requestedProficiency: targetLevel,
      answers,
    });

    // If verified, trigger automatic notifications to learners waiting for this skill
    if (evaluation.passed) {
      notifyLearnersOfNewMentor(user.userId, skillId);
    }

    return NextResponse.json({
      success: true,
      result: evaluation,
    });
  } catch (err: any) {
    console.error('Assessment Submission Error:', err);
    return NextResponse.json({ error: 'Failed to process skill assessment' }, { status: 500 });
  }
}
