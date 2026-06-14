import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/settings/company-profile - Get company profile
router.get('/company-profile', async (req, res) => {
  try {
    let companyProfile = await prisma.companyProfile.findFirst({
      include: {
        jobPositions: {
          orderBy: { createdAt: 'asc' }
        }
      }
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
        include: {
          jobPositions: true
        }
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
router.put('/company-profile', requireAdmin, [
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
        include: {
          jobPositions: {
            orderBy: { createdAt: 'asc' }
          }
        }
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
        include: {
          jobPositions: true
        }
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
router.post('/sources', requireAdmin, [
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
router.delete('/sources/:id', requireAdmin, async (req, res) => {
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
router.post('/test-library', requireAdmin, [
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
router.put('/test-library/:id', requireAdmin, [
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
router.delete('/test-library/:id', requireAdmin, async (req, res) => {
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





