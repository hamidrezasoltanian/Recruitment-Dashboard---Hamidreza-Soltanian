import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/stages - Get all stages
router.get('/', async (req, res) => {
  try {
    const stages = await prisma.kanbanStage.findMany({
      orderBy: { order: 'asc' }
    });

    res.json({
      success: true,
      data: stages
    });
  } catch (error) {
    console.error('Get stages error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت مراحل'
    });
  }
});

// POST /api/stages - Create new stage (Admin only)
router.post('/', requireAdmin, [
  body('title')
    .notEmpty()
    .withMessage('عنوان مرحله الزامی است')
    .isLength({ min: 2, max: 50 })
    .withMessage('عنوان باید بین 2 تا 50 کاراکتر باشد'),
  body('isCore')
    .optional()
    .isBoolean()
    .withMessage('isCore باید boolean باشد'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('ترتیب باید عدد مثبت باشد')
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

    const { title, isCore = false, order = 0 } = req.body;

    const stage = await prisma.kanbanStage.create({
      data: {
        title,
        isCore,
        order
      }
    });

    res.status(201).json({
      success: true,
      data: stage,
      message: 'مرحله با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Create stage error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ایجاد مرحله'
    });
  }
});

// PUT /api/stages/:id - Update stage (Admin only)
router.put('/:id', requireAdmin, [
  body('title')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('عنوان باید بین 2 تا 50 کاراکتر باشد'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('ترتیب باید عدد مثبت باشد')
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

    const existingStage = await prisma.kanbanStage.findUnique({
      where: { id }
    });

    if (!existingStage) {
      return res.status(404).json({
        success: false,
        error: 'مرحله یافت نشد'
      });
    }

    if (existingStage.isCore && updateData.isCore === false) {
      return res.status(400).json({
        success: false,
        error: 'نمی‌توان مرحله اصلی را غیراصلی کرد'
      });
    }

    const stage = await prisma.kanbanStage.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: stage,
      message: 'مرحله با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Update stage error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در به‌روزرسانی مرحله'
    });
  }
});

// DELETE /api/stages/:id - Delete stage (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existingStage = await prisma.kanbanStage.findUnique({
      where: { id }
    });

    if (!existingStage) {
      return res.status(404).json({
        success: false,
        error: 'مرحله یافت نشد'
      });
    }

    if (existingStage.isCore) {
      return res.status(400).json({
        success: false,
        error: 'نمی‌توان مرحله اصلی را حذف کرد'
      });
    }

    // Check if any candidates are using this stage
    const candidatesCount = await prisma.candidate.count({
      where: { stage: id }
    });

    if (candidatesCount > 0) {
      return res.status(400).json({
        success: false,
        error: `نمی‌توان این مرحله را حذف کرد زیرا ${candidatesCount} متقاضی در این مرحله قرار دارد`
      });
    }

    await prisma.kanbanStage.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'مرحله با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete stage error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف مرحله'
    });
  }
});

// PATCH /api/stages/reorder - Reorder stages (Admin only)
router.patch('/reorder', requireAdmin, [
  body('stages')
    .isArray()
    .withMessage('stages باید آرایه باشد'),
  body('stages.*.id')
    .notEmpty()
    .withMessage('شناسه مرحله الزامی است'),
  body('stages.*.order')
    .isInt({ min: 0 })
    .withMessage('ترتیب باید عدد مثبت باشد')
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

    const { stages } = req.body;

    // Update all stages with new order
    await Promise.all(
      stages.map((stage: any) =>
        prisma.kanbanStage.update({
          where: { id: stage.id },
          data: { order: stage.order }
        })
      )
    );

    const updatedStages = await prisma.kanbanStage.findMany({
      orderBy: { order: 'asc' }
    });

    res.json({
      success: true,
      data: updatedStages,
      message: 'ترتیب مراحل با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Reorder stages error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تغییر ترتیب مراحل'
    });
  }
});

export default router;





