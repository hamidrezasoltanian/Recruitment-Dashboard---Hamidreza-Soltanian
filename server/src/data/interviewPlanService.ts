import { PrismaClient } from '@prisma/client';
import { INTERVIEW_PLANS, InterviewPlanSeed } from './interviewPlans';

const positionInclude = {
  sections: {
    orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
    include: {
      questions: {
        orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
      },
    },
  },
  criteria: {
    orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
  },
};

export function getJobPositionsInclude() {
  return {
    jobPositions: {
      orderBy: { createdAt: 'asc' as const },
      include: positionInclude,
    },
  };
}

export async function applyInterviewPlan(
  prisma: PrismaClient,
  jobPositionId: string,
  plan: InterviewPlanSeed,
  options: { replace?: boolean } = {}
) {
  const replace = options.replace ?? true;

  if (replace) {
    await prisma.interviewSection.deleteMany({ where: { jobPositionId } });
    await prisma.evaluationCriterion.deleteMany({ where: { jobPositionId } });
  }

  await prisma.jobPosition.update({
    where: { id: jobPositionId },
    data: {
      interviewDurationMinutes: plan.interviewDurationMinutes,
      scoreGuide: JSON.stringify(plan.scoreGuide),
      updatedAt: new Date(),
    },
  });

  for (let sIndex = 0; sIndex < plan.sections.length; sIndex++) {
    const section = plan.sections[sIndex];
    await prisma.interviewSection.create({
      data: {
        title: section.title,
        durationMinutes: section.durationMinutes,
        order: sIndex,
        jobPositionId,
        questions: {
          create: section.questions.map((text, qIndex) => ({
            text,
            maxScore: 4,
            order: qIndex,
          })),
        },
      },
    });
  }

  for (let cIndex = 0; cIndex < plan.criteria.length; cIndex++) {
    const criterion = plan.criteria[cIndex];
    await prisma.evaluationCriterion.create({
      data: {
        title: criterion.title,
        description: criterion.description || null,
        maxScore: criterion.maxScore ?? 4,
        order: cIndex,
        jobPositionId,
      },
    });
  }

  return prisma.jobPosition.findUnique({
    where: { id: jobPositionId },
    include: positionInclude,
  });
}

/** Seed interview plans for matching job titles when empty (or force replace). */
export async function seedInterviewPlansForPositions(
  prisma: PrismaClient,
  options: { force?: boolean } = {}
) {
  const positions = await prisma.jobPosition.findMany({
    include: {
      sections: true,
      criteria: true,
    },
  });

  let applied = 0;
  for (const position of positions) {
    const plan = INTERVIEW_PLANS.find((p) => p.title === position.title);
    if (!plan) continue;

    const isEmpty = position.sections.length === 0 && position.criteria.length === 0;
    if (!options.force && !isEmpty) continue;

    await applyInterviewPlan(prisma, position.id, plan, { replace: true });
    applied += 1;
    console.log(`✅ Interview plan applied: ${position.title}`);
  }

  return applied;
}

export { positionInclude };
