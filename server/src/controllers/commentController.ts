import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const { candidateId } = req.params;
    const { text } = req.body;
    const userId = req.user!.userId;

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'متقاضی یافت نشد'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        candidateId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'یادداشت با موفقیت اضافه شد'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در اضافه کردن یادداشت'
    });
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { candidateId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت یادداشت‌ها'
    });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user!.userId;

    // Check if comment exists and belongs to user
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        userId
      }
    });

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'یادداشت یافت نشد یا دسترسی غیرمجاز'
      });
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { text },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: comment,
      message: 'یادداشت با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در به‌روزرسانی یادداشت'
    });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.userId;

    // Check if comment exists and belongs to user
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        userId
      }
    });

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'یادداشت یافت نشد یا دسترسی غیرمجاز'
      });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({
      success: true,
      message: 'یادداشت با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف یادداشت'
    });
  }
};

export const addHistoryEntry = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const { candidateId } = req.params;
    const { action, details } = req.body;
    const userId = req.user!.userId;

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'متقاضی یافت نشد'
      });
    }

    const historyEntry = await prisma.historyEntry.create({
      data: {
        action,
        details,
        candidateId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: historyEntry,
      message: 'رویداد جدید در تاریخچه ثبت شد'
    });
  } catch (error) {
    console.error('Add history entry error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ثبت رویداد در تاریخچه'
    });
  }
};

// Validation rules
export const validateAddComment = [
  body('text')
    .notEmpty()
    .withMessage('متن یادداشت الزامی است')
    .isLength({ min: 1, max: 1000 })
    .withMessage('متن یادداشت باید بین 1 تا 1000 کاراکتر باشد')
];

export const validateUpdateComment = [
  body('text')
    .notEmpty()
    .withMessage('متن یادداشت الزامی است')
    .isLength({ min: 1, max: 1000 })
    .withMessage('متن یادداشت باید بین 1 تا 1000 کاراکتر باشد')
];

export const validateAddHistoryEntry = [
  body('action')
    .notEmpty()
    .withMessage('عمل الزامی است')
    .isLength({ min: 1, max: 200 })
    .withMessage('عمل باید بین 1 تا 200 کاراکتر باشد'),
  body('details')
    .optional()
    .isLength({ max: 500 })
    .withMessage('جزئیات نمی‌تواند بیش از 500 کاراکتر باشد')
];

