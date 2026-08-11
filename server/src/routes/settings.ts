import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { getJobPositionsInclude, positionInclude, applyInterviewPlan, seedInterviewPlansForPositions } from '../data/interviewPlanService';
import { INTERVIEW_PLANS } from '../data/interviewPlans';

const prisma = new PrismaClient();
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/settings/company-profile - Get company profile
router.get('/company-profile', async (req, res) => {
  try {
    const jobPositionsInclude = getJobPositionsInclude();

    let companyProfile = await prisma.companyProfile.findFirst({
      include: jobPositionsInclude
    });

    // Create default if none exists
    if (!companyProfile) {
      companyProfile = await prisma.companyProfile.create({
        data: {
          name: 'شرکت شما',
          website: 'https://yourcompany.com',
          address: 'آدرس شرکت شما',
          jobPositions: {
            create: [
              { title: 'توسعه‌دهنده ارشد React' },
              { title: 'مدیر محصول' },
              { title: 'کارشناس بازاریابی دیجیتال' }
            ]
          }
        },
        include: jobPositionsInclude
      });
    }

    res.json({
      success: true,
      data: companyProfile
    });
  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت پروفایل شرکت'
    });
  }
});

// PUT /api/settings/company-profile - Update company profile (Admin only)
router.put('/company-profile', [
  body('name')
    .notEmpty()
    .withMessage('نام شرکت الزامی است')
    .isLength({ min: 2, max: 100 })
    .withMessage('نام باید بین 2 تا 100 کاراکتر باشد'),
  body('website')
    .isURL()
    .withMessage('آدرس وب‌سایت معتبر نیست'),
  body('address')
    .notEmpty()
    .withMessage('آدرس الزامی است')
    .isLength({ min: 10, max: 200 })
    .withMessage('آدرس باید بین 10 تا 200 کاراکتر باشد')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const { name, website, address } = req.body;

    let companyProfile = await prisma.companyProfile.findFirst();

    if (companyProfile) {
      companyProfile = await prisma.companyProfile.update({
        where: { id: companyProfile.id },
        data: {
          name,
          website,
          address,
          updatedAt: new Date()
        },
        include: getJobPositionsInclude()
      });
    } else {
      companyProfile = await prisma.companyProfile.create({
        data: {
          name,
          website,
          address,
          jobPositions: {
            create: []
          }
        },
        include: getJobPositionsInclude()
      });
    }

    res.json({
      success: true,
      data: companyProfile,
      message: 'پروفایل شرکت با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Update company profile error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در به‌روزرسانی پروفایل شرکت'
    });
  }
});

// POST /api/settings/job-positions - Add job position (Admin only)
router.post('/job-positions', [
  body('title').notEmpty().withMessage('عنوان الزامی است').isLength({ min: 2, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'داده‌های ورودی نامعتبر' });

    let companyProfile = await prisma.companyProfile.findFirst();
    if (!companyProfile) {
      companyProfile = await prisma.companyProfile.create({ data: { name: 'شرکت شما', website: 'https://example.com', address: 'آدرس' } });
    }

    const position = await prisma.jobPosition.create({
      data: { title: req.body.title, companyProfileId: companyProfile.id }
    });
    res.status(201).json({ success: true, data: position });
  } catch (error) {
    console.error('Add job position error:', error);
    res.status(500).json({ success: false, error: 'خطا در افزودن موقعیت شغلی' });
  }
});

// PUT /api/settings/job-positions/:id - Update job position
router.put('/job-positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof req.body.title === 'string') data.title = req.body.title;
    if (typeof req.body.interviewDurationMinutes === 'number') {
      data.interviewDurationMinutes = req.body.interviewDurationMinutes;
    }
    if (req.body.scoreGuide !== undefined) {
      data.scoreGuide = typeof req.body.scoreGuide === 'string'
        ? req.body.scoreGuide
        : JSON.stringify(req.body.scoreGuide);
    }

    const position = await prisma.jobPosition.update({
      where: { id },
      data,
      include: positionInclude,
    });
    res.json({ success: true, data: position });
  } catch (error) {
    console.error('Update job position error:', error);
    res.status(500).json({ success: false, error: 'خطا در ویرایش موقعیت شغلی' });
  }
});

// DELETE /api/settings/job-positions/:id
router.delete('/job-positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.jobPosition.delete({ where: { id } });
    res.json({ success: true, message: 'موقعیت شغلی حذف شد' });
  } catch (error) {
    console.error('Delete job position error:', error);
    res.status(500).json({ success: false, error: 'خطا در حذف موقعیت شغلی' });
  }
});

// GET /api/settings/job-positions/:id/interview-plan
router.get('/job-positions/:id/interview-plan', async (req, res) => {
  try {
    const position = await prisma.jobPosition.findUnique({
      where: { id: req.params.id },
      include: positionInclude,
    });
    if (!position) {
      return res.status(404).json({ success: false, error: 'موقعیت شغلی یافت نشد' });
    }
    res.json({ success: true, data: position });
  } catch (error) {
    console.error('Get interview plan error:', error);
    res.status(500).json({ success: false, error: 'خطا در دریافت سناریوی مصاحبه' });
  }
});

// POST /api/settings/job-positions/:id/apply-default-plan
router.post('/job-positions/:id/apply-default-plan', async (req, res) => {
  try {
    const position = await prisma.jobPosition.findUnique({ where: { id: req.params.id } });
    if (!position) {
      return res.status(404).json({ success: false, error: 'موقعیت شغلی یافت نشد' });
    }
    const plan = INTERVIEW_PLANS.find((p) => p.title === position.title);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'سناریوی پیش‌فرض برای این پوزیشن تعریف نشده است' });
    }
    const updated = await applyInterviewPlan(prisma, position.id, plan, { replace: true });
    res.json({ success: true, data: updated, message: 'سناریوی پیش‌فرض اعمال شد' });
  } catch (error) {
    console.error('Apply default plan error:', error);
    res.status(500).json({ success: false, error: 'خطا در اعمال سناریوی پیش‌فرض' });
  }
});

// POST /api/settings/interview-plans/seed-defaults
router.post('/interview-plans/seed-defaults', async (req, res) => {
  try {
    const force = Boolean(req.body?.force);
    const applied = await seedInterviewPlansForPositions(prisma, { force });
    const profile = await prisma.companyProfile.findFirst({ include: getJobPositionsInclude() });
    res.json({ success: true, data: { applied, profile }, message: `${applied} سناریو اعمال شد` });
  } catch (error) {
    console.error('Seed interview plans error:', error);
    res.status(500).json({ success: false, error: 'خطا در seeding سناریوها' });
  }
});

// Sections
router.post('/job-positions/:id/sections', [
  body('title').notEmpty().isLength({ min: 2, max: 200 }),
  body('durationMinutes').optional().isInt({ min: 1, max: 180 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'داده‌های ورودی نامعتبر' });

    const count = await prisma.interviewSection.count({ where: { jobPositionId: req.params.id } });
    const section = await prisma.interviewSection.create({
      data: {
        title: req.body.title.trim(),
        durationMinutes: req.body.durationMinutes ?? 5,
        order: typeof req.body.order === 'number' ? req.body.order : count,
        jobPositionId: req.params.id,
      },
      include: { questions: true },
    });
    res.status(201).json({ success: true, data: section });
  } catch (error) {
    console.error('Add section error:', error);
    res.status(500).json({ success: false, error: 'خطا در افزودن بخش' });
  }
});

router.put('/interview-sections/:id', async (req, res) => {
  try {
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof req.body.title === 'string') data.title = req.body.title.trim();
    if (typeof req.body.durationMinutes === 'number') data.durationMinutes = req.body.durationMinutes;
    if (typeof req.body.order === 'number') data.order = req.body.order;
    const section = await prisma.interviewSection.update({
      where: { id: req.params.id },
      data,
      include: { questions: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
    });
    res.json({ success: true, data: section });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ success: false, error: 'خطا در ویرایش بخش' });
  }
});

router.delete('/interview-sections/:id', async (req, res) => {
  try {
    await prisma.interviewSection.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'بخش حذف شد' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ success: false, error: 'خطا در حذف بخش' });
  }
});

// Script questions
router.post('/interview-sections/:id/questions', [
  body('text').notEmpty().isLength({ min: 2, max: 1000 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'داده‌های ورودی نامعتبر' });
    const count = await prisma.interviewScriptQuestion.count({ where: { sectionId: req.params.id } });
    const question = await prisma.interviewScriptQuestion.create({
      data: {
        text: req.body.text.trim(),
        maxScore: typeof req.body.maxScore === 'number' ? req.body.maxScore : 4,
        order: typeof req.body.order === 'number' ? req.body.order : count,
        sectionId: req.params.id,
      },
    });
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error('Add script question error:', error);
    res.status(500).json({ success: false, error: 'خطا در افزودن سوال' });
  }
});

router.put('/interview-script-questions/:id', async (req, res) => {
  try {
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof req.body.text === 'string') data.text = req.body.text.trim();
    if (typeof req.body.order === 'number') data.order = req.body.order;
    const question = await prisma.interviewScriptQuestion.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: question });
  } catch (error) {
    console.error('Update script question error:', error);
    res.status(500).json({ success: false, error: 'خطا در ویرایش سوال' });
  }
});

router.delete('/interview-script-questions/:id', async (req, res) => {
  try {
    await prisma.interviewScriptQuestion.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'سوال حذف شد' });
  } catch (error) {
    console.error('Delete script question error:', error);
    res.status(500).json({ success: false, error: 'خطا در حذف سوال' });
  }
});

// Criteria
router.post('/job-positions/:id/criteria', [
  body('title').notEmpty().isLength({ min: 2, max: 200 }),
  body('maxScore').optional().isInt({ min: 1, max: 10 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'داده‌های ورودی نامعتبر' });
    const count = await prisma.evaluationCriterion.count({ where: { jobPositionId: req.params.id } });
    const criterion = await prisma.evaluationCriterion.create({
      data: {
        title: req.body.title.trim(),
        description: typeof req.body.description === 'string' ? req.body.description.trim() : null,
        maxScore: req.body.maxScore ?? 4,
        order: typeof req.body.order === 'number' ? req.body.order : count,
        jobPositionId: req.params.id,
      },
    });
    res.status(201).json({ success: true, data: criterion });
  } catch (error) {
    console.error('Add criterion error:', error);
    res.status(500).json({ success: false, error: 'خطا در افزودن معیار' });
  }
});

router.put('/evaluation-criteria/:id', async (req, res) => {
  try {
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof req.body.title === 'string') data.title = req.body.title.trim();
    if (typeof req.body.description === 'string') data.description = req.body.description.trim();
    if (typeof req.body.maxScore === 'number') data.maxScore = req.body.maxScore;
    if (typeof req.body.order === 'number') data.order = req.body.order;
    const criterion = await prisma.evaluationCriterion.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: criterion });
  } catch (error) {
    console.error('Update criterion error:', error);
    res.status(500).json({ success: false, error: 'خطا در ویرایش معیار' });
  }
});

router.delete('/evaluation-criteria/:id', async (req, res) => {
  try {
    await prisma.evaluationCriterion.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'معیار حذف شد' });
  } catch (error) {
    console.error('Delete criterion error:', error);
    res.status(500).json({ success: false, error: 'خطا در حذف معیار' });
  }
});

// GET /api/settings/sources - Get all sources
router.get('/sources', async (req, res) => {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت منابع'
    });
  }
});

// POST /api/settings/sources - Add new source (Admin only)
router.post('/sources', [
  body('name')
    .notEmpty()
    .withMessage('نام منبع الزامی است')
    .isLength({ min: 2, max: 50 })
    .withMessage('نام باید بین 2 تا 50 کاراکتر باشد')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const { name } = req.body;

    // Check if source already exists
    const existingSource = await prisma.source.findUnique({
      where: { name }
    });

    if (existingSource) {
      return res.status(400).json({
        success: false,
        error: 'منبع با این نام قبلاً وجود دارد'
      });
    }

    const source = await prisma.source.create({
      data: { name }
    });

    res.status(201).json({
      success: true,
      data: source,
      message: 'منبع با موفقیت اضافه شد'
    });
  } catch (error) {
    console.error('Add source error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در اضافه کردن منبع'
    });
  }
});

// DELETE /api/settings/sources/:id - Delete source (Admin only)
router.delete('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any candidates are using this source
    const candidatesCount = await prisma.candidate.count({
      where: { source: id }
    });

    if (candidatesCount > 0) {
      return res.status(400).json({
        success: false,
        error: `نمی‌توان این منبع را حذف کرد زیرا ${candidatesCount} متقاضی از این منبع استفاده می‌کند`
      });
    }

    await prisma.source.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'منبع با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete source error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف منبع'
    });
  }
});

// GET /api/settings/test-library - Get test library
router.get('/test-library', async (req, res) => {
  try {
    const testLibrary = await prisma.testLibraryItem.findMany({
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: testLibrary
    });
  } catch (error) {
    console.error('Get test library error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت کتابخانه آزمون‌ها'
    });
  }
});

// POST /api/settings/test-library - Add test library item (Admin only)
router.post('/test-library', [
  body('name')
    .notEmpty()
    .withMessage('نام آزمون الزامی است')
    .isLength({ min: 2, max: 100 })
    .withMessage('نام باید بین 2 تا 100 کاراکتر باشد'),
  body('url')
    .isURL()
    .withMessage('آدرس آزمون معتبر نیست')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const { name, url } = req.body;

    const testItem = await prisma.testLibraryItem.create({
      data: { name, url }
    });

    res.status(201).json({
      success: true,
      data: testItem,
      message: 'آزمون با موفقیت اضافه شد'
    });
  } catch (error) {
    console.error('Add test library item error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در اضافه کردن آزمون'
    });
  }
});

// PUT /api/settings/test-library/:id - Update test library item (Admin only)
router.put('/test-library/:id', [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('نام باید بین 2 تا 100 کاراکتر باشد'),
  body('url')
    .optional()
    .isURL()
    .withMessage('آدرس آزمون معتبر نیست')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const existingItem = await prisma.testLibraryItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'آزمون یافت نشد'
      });
    }

    const testItem = await prisma.testLibraryItem.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: testItem,
      message: 'آزمون با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Update test library item error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در به‌روزرسانی آزمون'
    });
  }
});

// DELETE /api/settings/test-library/:id - Delete test library item (Admin only)
router.delete('/test-library/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.testLibraryItem.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'آزمون با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete test library item error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف آزمون'
    });
  }
});

export default router;





