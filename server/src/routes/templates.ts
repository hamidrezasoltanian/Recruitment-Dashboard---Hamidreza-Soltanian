import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/templates - Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت قالب‌ها'
    });
  }
});

// GET /api/templates/:id - Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'قالب یافت نشد'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت قالب'
    });
  }
});

// POST /api/templates - Create new template (Admin only)
router.post('/', requireAdmin, [
  body('name')
    .notEmpty()
    .withMessage('نام قالب الزامی است')
    .isLength({ min: 2, max: 100 })
    .withMessage('نام باید بین 2 تا 100 کاراکتر باشد'),
  body('content')
    .notEmpty()
    .withMessage('محتوای قالب الزامی است')
    .isLength({ min: 10, max: 5000 })
    .withMessage('محتوا باید بین 10 تا 5000 کاراکتر باشد'),
  body('type')
    .isIn(['email', 'whatsapp'])
    .withMessage('نوع قالب باید email یا whatsapp باشد'),
  body('stageId')
    .optional()
    .isString()
    .withMessage('شناسه مرحله باید رشته باشد')
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

    const { name, content, type, stageId } = req.body;

    const template = await prisma.template.create({
      data: {
        name,
        content,
        type,
        stageId
      }
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'قالب با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ایجاد قالب'
    });
  }
});

// PUT /api/templates/:id - Update template (Admin only)
router.put('/:id', requireAdmin, [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('نام باید بین 2 تا 100 کاراکتر باشد'),
  body('content')
    .optional()
    .isLength({ min: 10, max: 5000 })
    .withMessage('محتوا باید بین 10 تا 5000 کاراکتر باشد'),
  body('type')
    .optional()
    .isIn(['email', 'whatsapp'])
    .withMessage('نوع قالب باید email یا whatsapp باشد'),
  body('stageId')
    .optional()
    .isString()
    .withMessage('شناسه مرحله باید رشته باشد')
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

    const existingTemplate = await prisma.template.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'قالب یافت نشد'
      });
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: template,
      message: 'قالب با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در به‌روزرسانی قالب'
    });
  }
});

// DELETE /api/templates/:id - Delete template (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existingTemplate = await prisma.template.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'قالب یافت نشد'
      });
    }

    await prisma.template.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'قالب با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف قالب'
    });
  }
});

export default router;





