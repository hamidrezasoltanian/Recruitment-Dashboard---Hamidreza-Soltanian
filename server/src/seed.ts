import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_TEMPLATES } from './data/defaultTemplates';
import { seedInterviewPlansForPositions } from './data/interviewPlanService';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const hashedAdminPass = await bcrypt.hash('adminpassword', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'مدیر سیستم',
      password: hashedAdminPass,
      isAdmin: true,
    },
  });

  const hashedHrPass = await bcrypt.hash('hrpassword', 12);
  const hr = await prisma.user.upsert({
    where: { username: 'hr' },
    update: {},
    create: {
      username: 'hr',
      name: 'کارشناس منابع انسانی',
      password: hashedHrPass,
      isAdmin: false,
    },
  });

  // Create default Kanban stages
  const stages = [
    { id: 'inbox', title: 'صندوق ورودی', isCore: true, order: 0 },
    { id: 'review', title: 'در حال بررسی', isCore: false, order: 1 },
    { id: 'interview-1', title: 'مصاحبه اول', isCore: false, order: 2 },
    { id: 'interview-2', title: 'مصاحبه دوم', isCore: false, order: 3 },
    { id: 'test', title: 'آزمون', isCore: false, order: 4 },
    { id: 'hired', title: 'استخدام شده', isCore: true, order: 5 },
    { id: 'rejected', title: 'رد شده', isCore: true, order: 6 },
  ];

  for (const stage of stages) {
    await prisma.kanbanStage.upsert({
      where: { id: stage.id },
      update: {},
      create: stage,
    });
  }

  // Create default sources
  const sources = ['لینکدین', 'جابینجا', 'ای-استخدام', 'سایت شرکت', 'معرفی‌شده', 'سایر'];
  for (const name of sources) {
    await prisma.source.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Create company profile
  const existingProfile = await prisma.companyProfile.findFirst();
  if (!existingProfile) {
    const company = await prisma.companyProfile.create({
      data: {
        name: 'شرکت شما',
        website: 'https://yourcompany.com',
        address: 'آدرس شرکت شما',
        jobPositions: {
          create: [
            { title: 'توسعه‌دهنده ارشد React' },
            { title: 'مدیر محصول' },
            { title: 'کارشناس بازاریابی دیجیتال' },
          ],
        },
      },
    });
    console.log('✅ Company profile created:', company.name);
  }

  // Apply default interview plans for known positions (when empty)
  const appliedPlans = await seedInterviewPlansForPositions(prisma, { force: false });
  console.log(`✅ Interview plans seeded/applied: ${appliedPlans}`);

  // Create test library items
  const tests = [
    { name: 'تست کهن‌الگو', url: 'https://socianttest.com/archetype/' },
    { name: 'تست MBTI', url: 'https://socianttest.com/mbti/' },
    { name: 'تست هوش هیجانی EQ', url: 'https://socianttest.com/emotional-intelligence-eq/' },
    { name: 'تست هوش IQ RAVEN', url: 'https://socianttest.com/raven-intelligence/' },
    { name: 'تست طرحواره', url: 'https://socianttest.com/tarhvare/' },
    { name: 'تست DISC', url: 'https://socianttest.com/disc/' },
    { name: 'تست سبک حل تعارض', url: 'https://socianttest.com/thomas-kilman-conflict-resolution-styles/' },
    { name: 'تست شخصیت فروشنده', url: 'https://socianttest.com/identification-of-the-personality-of-the-seller/' },
    { name: 'تست تحلیل رفتار متقابل', url: 'https://socianttest.com/interaction-analysis/' },
    { name: 'تست نئو', url: 'https://socianttest.com/neo/' },
  ];

  for (const test of tests) {
    const existing = await prisma.testLibraryItem.findFirst({ where: { name: test.name } });
    if (!existing) {
      await prisma.testLibraryItem.create({ data: test });
    }
  }

  // Upsert polished default email/WhatsApp templates (always refresh content)
  for (const tpl of DEFAULT_TEMPLATES) {
    await prisma.template.upsert({
      where: { id: tpl.id },
      update: {
        name: tpl.name,
        type: tpl.type,
        stageId: tpl.stageId ?? null,
        content: tpl.content,
      },
      create: {
        id: tpl.id,
        name: tpl.name,
        type: tpl.type,
        stageId: tpl.stageId ?? null,
        content: tpl.content,
      },
    });
  }
  console.log(`✅ ${DEFAULT_TEMPLATES.length} templates upserted`);

  // Create a sample candidate
  const existingCandidate = await prisma.candidate.findFirst();
  if (!existingCandidate) {
    await prisma.candidate.create({
      data: {
        name: 'حمیدرضا سلطانیان',
        email: 'hamidreza.soltanian@gmail.com',
        phone: '09125100121',
        position: 'توسعه‌دهنده ارشد React',
        stage: 'interview-1',
        source: 'معرفی‌شده',
        rating: 5,
        userId: admin.id,
        history: {
          create: [{ action: 'متقاضی ایجاد شد (نمونه)', userId: admin.id }],
        },
        comments: {
          create: [{ text: 'کاندیدای بسیار قوی، حتما مصاحبه شود.', userId: admin.id }],
        },
      },
    });
  }

  console.log('✅ Admin user:', admin.username);
  console.log('✅ HR user:', hr.username);
  console.log('✅ Stages created');
  console.log('✅ Sources created');
  console.log('✅ Test library created');
  console.log('✅ Templates created');
  console.log('✅ Sample candidate created');
  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin: admin / adminpassword');
  console.log('   HR:    hr / hrpassword');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
