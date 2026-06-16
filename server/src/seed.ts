import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  // Create default email/WhatsApp templates
  const emailFooter = `\\n\\nبا احترام،\\nتیم استخدام {{companyName}}\\n{{companyWebsite}}`;
  const whatsappFooter = `\\n\\nبا احترام،\\nتیم استخدام {{companyName}}`;

  const templates = [
    {
      id: 'tpl_inbox_email',
      name: 'ایمیل دریافت رزومه (صندوق ورودی)',
      type: 'email',
      stageId: 'inbox',
      content: `سلام {{candidateName}} عزیز،\n\nرزومه شما برای موقعیت شغلی «{{position}}» در شرکت {{companyName}} دریافت شد.\n\nرزومه شما در حال بررسی است و به زودی نتیجه را به شما اطلاع خواهیم داد.\n\nاز صبر و شکیبایی شما متشکریم.` + emailFooter
    },
    {
      id: 'tpl_review_email',
      name: 'ایمیل اطلاع‌رسانی انتقال به بررسی',
      type: 'email',
      stageId: 'review',
      content: `سلام {{candidateName}} عزیز،\n\nجهت اطلاع، رزومه شما برای موقعیت شغلی «{{position}}» دریافت شد و در حال حاضر در مرحله «{{stageName}}» قرار دارد.\n\nبه زودی نتیجه بررسی را به شما اطلاع خواهیم داد.` + emailFooter
    },
    {
      id: 'tpl_interview-1_email',
      name: 'ایمیل دعوت به مصاحبه اول',
      type: 'email',
      stageId: 'interview-1',
      content: `سلام {{candidateName}} عزیز،\n\nخبر خوبی داریم! رزومه شما برای موقعیت «{{position}}» بررسی شد و مایلیم شما را به مرحله «{{stageName}}» دعوت کنیم.\n\nزمان مصاحبه شما برای تاریخ {{interviewDate}} ساعت {{interviewTime}} در محل شرکت به آدرس زیر تنظیم شده است:\n{{companyAddress}}\n\nلطفا در صورت امکان، حضور خود را تایید بفرمایید.` + emailFooter
    },
    {
      id: 'tpl_interview-2_email',
      name: 'ایمیل دعوت به مصاحبه دوم (فنی/نهایی)',
      type: 'email',
      stageId: 'interview-2',
      content: `سلام {{candidateName}} عزیز،\n\nممنون از حضور شما در مصاحبه اولیه. مایلیم شما را برای مرحله بعدی، «{{stageName}}»، دعوت کنیم.\n\nزمان مصاحبه بعدی شما برای تاریخ {{interviewDate}} ساعت {{interviewTime}} در محل شرکت به آدرس زیر تنظیم شده است:\n{{companyAddress}}\n\nلطفا در صورت امکان، حضور خود را تایید بفرمایید.` + emailFooter
    },
    {
      id: 'tpl_test_email',
      name: 'ایمیل دعوت به آزمون',
      type: 'email',
      stageId: 'test',
      content: `سلام {{candidateName}} عزیز،\n\nممنون از حضور شما در مصاحبه‌ها. حالا مایلیم شما را به مرحله «{{stageName}}» دعوت کنیم.\n\nلطفا آزمون‌های مربوطه را در زمان مشخص شده تکمیل کنید. اطلاعات آزمون به زودی برای شما ارسال خواهد شد.\n\nموفق باشید!` + emailFooter
    },
    {
      id: 'tpl_hired_email',
      name: 'ایمیل استخدام (پیشنهاد شغلی)',
      type: 'email',
      stageId: 'hired',
      content: `سلام {{candidateName}} عزیز،\n\nامیدوارم حالت عالی باشه.\n\nبا خوشحالی بهت اطلاع می‌دیم که مراحل مصاحبه رو با موفقیت پشت سر گذاشتی و مایلیم موقعیت شغلی «{{position}}» رو در شرکت {{companyName}} به شما پیشنهاد بدیم.\n\nبه زودی برای هماهنگی جزئیات بیشتر با شما تماس می‌گیریم.` + emailFooter
    },
    {
      id: 'tpl_rejected_email',
      name: 'ایمیل رد درخواست',
      type: 'email',
      stageId: 'rejected',
      content: `سلام {{candidateName}} عزیز،\n\nاز ارسال رزومه شما برای موقعیت شغلی «{{position}}» در شرکت {{companyName}} متشکریم.\n\nمتاسفانه در این مرحله امکان همکاری با شما وجود ندارد. اما رزومه شما در آرشیو ما نگهداری می‌شود و در صورت وجود فرصت‌های مناسب در آینده، با شما تماس خواهیم گرفت.\n\nموفق باشید.` + emailFooter
    },
    {
      id: 'tpl_archived_email',
      name: 'ایمیل آرشیو شدن',
      type: 'email',
      stageId: 'archived',
      content: `سلام {{candidateName}} عزیز،\n\nرزومه شما برای موقعیت شغلی «{{position}}» در آرشیو ما قرار گرفت.\n\nدر صورت وجود فرصت‌های شغلی مناسب در آینده، با شما تماس خواهیم گرفت.\n\nموفق باشید.` + emailFooter
    },
    {
      id: 'tpl_email_invite_reminder',
      name: 'ایمیل یادآوری مصاحبه',
      type: 'email',
      stageId: null,
      content: `سلام {{candidateName}} عزیز،\n\nاین یک پیام یادآوری برای جلسه مصاحبه شما برای موقعیت شغلی «{{position}}» است.\n\nزمان مصاحبه: {{interviewDate}} ساعت {{interviewTime}}\nمکان: {{companyAddress}}\n\nمنتظر دیدار شما هستیم.` + emailFooter
    },
    // --- WhatsApp Templates ---
    {
      id: 'tpl_inbox_whatsapp',
      name: 'واتسپ دریافت رزومه (صندوق ورودی)',
      type: 'whatsapp',
      stageId: 'inbox',
      content: `سلام {{candidateName}} عزیز 👋\n\nرزومه شما برای موقعیت «{{position}}» در شرکت {{companyName}} دریافت شد.\n\nرزومه شما در حال بررسی است و به زودی نتیجه را به شما اطلاع می‌دهیم.\n\nاز صبر و شکیبایی شما متشکریم.` + whatsappFooter
    },
    {
      id: 'tpl_review_whatsapp',
      name: 'واتسپ اطلاع‌رسانی انتقال به بررسی',
      type: 'whatsapp',
      stageId: 'review',
      content: `سلام {{candidateName}} عزیز. جهت اطلاع، رزومه شما برای موقعیت «{{position}}» در شرکت {{companyName}} دریافت شد و در مرحله «{{stageName}}» قرار دارد. به زودی نتیجه را به شما اطلاع می‌دهیم.` + whatsappFooter
    },
    {
      id: 'tpl_interview-1_whatsapp',
      name: 'واتسپ دعوت به مصاحبه اول',
      type: 'whatsapp',
      stageId: 'interview-1',
      content: `سلام {{candidateName}} عزیز. خبر خوبی داریم! 🎉\n\nرزومه شما برای موقعیت «{{position}}» بررسی شد و مایلیم شما را به مرحله «{{stageName}}» دعوت کنیم.\n\nزمان مصاحبه شما: {{interviewDate}} ساعت {{interviewTime}}\nمکان: {{companyAddress}}\n\nلطفا حضور خود را تایید بفرمایید.` + whatsappFooter
    },
    {
      id: 'tpl_interview-2_whatsapp',
      name: 'واتسپ دعوت به مصاحبه دوم',
      type: 'whatsapp',
      stageId: 'interview-2',
      content: `سلام {{candidateName}} عزیز. ممنون از حضور شما در مصاحبه اولیه. مایلیم شما را برای مرحله بعدی، «{{stageName}}»، دعوت کنیم.\n\nزمان مصاحبه بعدی: {{interviewDate}} ساعت {{interviewTime}}\nمکان: {{companyAddress}}\n\nلطفا حضور خود را تایید بفرمایید.` + whatsappFooter
    },
    {
      id: 'tpl_test_whatsapp',
      name: 'واتسپ دعوت به آزمون',
      type: 'whatsapp',
      stageId: 'test',
      content: `سلام {{candidateName}} عزیز. ممنون از حضور شما در مصاحبه‌ها.\n\nحالا مایلیم شما را به مرحله «{{stageName}}» دعوت کنیم.\n\nلطفا آزمون‌های مربوطه را در زمان مشخص شده تکمیل کنید. اطلاعات آزمون به زودی برای شما ارسال خواهد شد.\n\nموفق باشید! 🍀` + whatsappFooter
    },
    {
      id: 'tpl_hired_whatsapp',
      name: 'واتسپ پیشنهاد شغلی',
      type: 'whatsapp',
      stageId: 'hired',
      content: `سلام {{candidateName}} عزیز. تبریک! 🎉\n\nشما در فرایند استخدام ما در شرکت {{companyName}} برای موقعیت شغلی «{{position}}» پذیرفته شدید.\n\nبرای هماهنگی جزئیات بیشتر به زودی با شما تماس می‌گیریم.` + whatsappFooter
    },
    {
      id: 'tpl_rejected_whatsapp',
      name: 'واتسپ رد درخواست',
      type: 'whatsapp',
      stageId: 'rejected',
      content: `سلام {{candidateName}} عزیز.\n\nاز ارسال رزومه شما برای موقعیت «{{position}}» در شرکت {{companyName}} متشکریم.\n\nمتاسفانه در این مرحله امکان همکاری با شما وجود ندارد. اما رزومه شما در آرشیو ما نگهداری می‌شود.\n\nموفق باشید.` + whatsappFooter
    },
    {
      id: 'tpl_archived_whatsapp',
      name: 'واتسپ آرشیو شدن',
      type: 'whatsapp',
      stageId: 'archived',
      content: `سلام {{candidateName}} عزیز.\n\nرزومه شما برای موقعیت «{{position}}» در آرشیو ما قرار گرفت.\n\nدر صورت وجود فرصت‌های شغلی مناسب در آینده، با شما تماس خواهیم گرفت.\n\nموفق باشید.` + whatsappFooter
    },
    {
      id: 'tpl_whatsapp_invite_reminder',
      name: 'واتسپ یادآوری مصاحبه',
      type: 'whatsapp',
      stageId: null,
      content: `یادآوری مصاحبه: سلام {{candidateName}} عزیز. جلسه مصاحبه شما برای موقعیت «{{position}}» در تاریخ {{interviewDate}} ساعت {{interviewTime}} است. منتظر دیدار شما هستیم.` + whatsappFooter
    }
  ];

  for (const tpl of templates) {
    await prisma.template.upsert({
      where: { id: tpl.id },
      update: {
        name: tpl.name,
        type: tpl.type,
        stageId: tpl.stageId,
        content: tpl.content
      },
      create: tpl,
    });
  }

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
