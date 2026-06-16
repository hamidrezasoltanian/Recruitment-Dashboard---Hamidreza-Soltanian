const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking current stages in DB...");
  const dbStages = await prisma.kanbanStage.findMany();
  console.log("DB Stages:", dbStages);

  const dbCandidates = await prisma.candidate.findMany({
    select: { id: true, name: true, stage: true }
  });
  console.log("DB Candidates:", dbCandidates);

  const dbTemplates = await prisma.template.findMany();
  console.log("DB Templates:", dbTemplates);

  // Map from old IDs to new IDs
  const idMap = {
    'stage_0': 'inbox',
    'stage_1': 'review',
    'stage_2': 'interview-1',
    'stage_3': 'interview-2',
    'stage_4': 'test',
    'stage_5': 'hired',
    'stage_6': 'rejected'
  };

  // 1. Fix Candidates using old stage IDs
  for (const candidate of dbCandidates) {
    const newStage = idMap[candidate.stage];
    if (newStage) {
      console.log(`Updating candidate ${candidate.name} stage from ${candidate.stage} to ${newStage}`);
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { stage: newStage }
      });
    }
  }

  // 2. Re-create stages with correct IDs
  const correctStages = [
    { id: 'inbox', title: 'صندوق ورودی', isCore: true, order: 0 },
    { id: 'review', title: 'در حال بررسی', isCore: false, order: 1 },
    { id: 'interview-1', title: 'مصاحبه اول', isCore: false, order: 2 },
    { id: 'interview-2', title: 'مصاحبه دوم', isCore: false, order: 3 },
    { id: 'test', title: 'آزمون', isCore: false, order: 4 },
    { id: 'hired', title: 'استخدام شده', isCore: true, order: 5 },
    { id: 'rejected', title: 'رد شده', isCore: true, order: 6 },
  ];

  for (const stage of correctStages) {
    await prisma.kanbanStage.upsert({
      where: { id: stage.id },
      update: { title: stage.title, isCore: stage.isCore, order: stage.order },
      create: stage
    });
  }

  // Delete old stage IDs if they exist
  for (const oldId of Object.keys(idMap)) {
    try {
      await prisma.kanbanStage.delete({
        where: { id: oldId }
      });
      console.log(`Deleted old stage: ${oldId}`);
    } catch (e) {
      // Ignore if doesn't exist
    }
  }

  console.log("Database stages fixed successfully!");
}

main().catch(e => {
  console.error(e);
}).finally(() => {
  prisma.$disconnect();
});
