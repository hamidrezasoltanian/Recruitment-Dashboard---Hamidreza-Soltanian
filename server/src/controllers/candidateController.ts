import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';
import { ApiResponse, Candidate } from '../types';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { search, position, source, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let whereClause: any = {};
    
    if (search) {
      whereClause.name = {
        contains: search as string,
        mode: 'insensitive'
      };
    }
    
    if (position) {
      whereClause.position = position as string;
    }
    
    if (source) {
      whereClause.source = source as string;
    }

    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            isAdmin: true
          }
        },
        comments: {
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
        },
        history: {
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
        },
        testResults: {
          orderBy: { createdAt: 'desc' }
        },
        resumeFiles: true,
        testFiles: true
      }
    });

    res.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت لیست متقاضیان'
    });
  }
};

export const getCandidateById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            isAdmin: true
          }
        },
        comments: {
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
        },
        history: {
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
        },
        testResults: {
          orderBy: { createdAt: 'desc' }
        },
        resumeFiles: true,
        testFiles: true
      }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'متقاضی یافت نشد'
      });
    }

    res.json({
      success: true,
      data: candidate
    });
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت اطلاعات متقاضی'
    });
  }
};

export const createCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const userId = req.user!.userId;
    const {
      name,
      email,
      phone,
      position,
      stage,
      source,
      rating = 0,
      interviewDate,
      interviewTime,
      interviewTimeChanged = false,
      evaluation
    } = req.body;

    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        phone,
        position,
        stage,
        source,
        rating,
        interviewDate,
        interviewTime,
        interviewTimeChanged,
        evaluation,
        userId,
        history: {
          create: {
            action: 'متقاضی ایجاد شد',
            userId
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            isAdmin: true
          }
        },
        comments: true,
        history: {
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
        },
        testResults: true,
        resumeFiles: true,
        testFiles: true
      }
    });

    res.status(201).json({
      success: true,
      data: candidate,
      message: 'متقاضی با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Create candidate error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ایجاد متقاضی'
    });
  }
};

export const updateCandidate = async (req: AuthRequest, res: Response) => {
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
    const userId = req.user!.userId;
    const updateData = req.body;

    // Check if candidate exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!existingCandidate) {
      return res.status(404).json({
        success: false,
        error: 'متقاضی یافت نشد'
      });
    }

    // Only update scalar fields - exclude relations and computed fields
    const { name, email, phone, position, source, stage, rating,
            interviewDate, interviewTime, interviewTimeChanged, hasResume, evaluation } = updateData;

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(position !== undefined && { position }),
        ...(source !== undefined && { source }),
        ...(stage !== undefined && { stage }),
        ...(rating !== undefined && { rating }),
        ...(interviewDate !== undefined && { interviewDate }),
        ...(interviewTime !== undefined && { interviewTime }),
        ...(interviewTimeChanged !== undefined && { interviewTimeChanged }),
        ...(hasResume !== undefined && { hasResume }),
        ...(evaluation !== undefined && { evaluation }),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            isAdmin: true
          }
        },
        comments: {
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
        },
        history: {
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
        },
        testResults: {
          orderBy: { createdAt: 'desc' }
        },
        resumeFiles: true,
        testFiles: true
      }
    });

    // Add history entry
    await prisma.historyEntry.create({
      data: {
        action: 'اطلاعات ویرایش شد',
        candidateId: id,
        userId
      }
    });

    res.json({
      success: true,
      data: candidate,
      message: 'اطلاعات متقاضی با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در به‌روزرسانی اطلاعات متقاضی'
    });
  }
};

export const deleteCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if candidate exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!existingCandidate) {
      return res.status(404).json({
        success: false,
        error: 'متقاضی یافت نشد'
      });
    }

    await prisma.candidate.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'متقاضی با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف متقاضی'
    });
  }
};

export const updateCandidateStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newStage } = req.body;
    const userId = req.user!.userId;

    const candidate = await prisma.candidate.update({
      where: { id },
      data: { stage: newStage },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            isAdmin: true
          }
        },
        comments: {
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
        },
        history: {
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
        },
        testResults: {
          orderBy: { createdAt: 'desc' }
        },
        resumeFiles: true,
        testFiles: true
      }
    });

    // Add history entry
    await prisma.historyEntry.create({
      data: {
        action: `مرحله به "${newStage}" تغییر کرد`,
        candidateId: id,
        userId
      }
    });

    res.json({
      success: true,
      data: candidate,
      message: `مرحله به ${newStage} تغییر کرد`
    });
  } catch (error) {
    console.error('Update candidate stage error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تغییر مرحله متقاضی'
    });
  }
};

// Validation rules
export const validateCreateCandidate = [
  body('name')
    .notEmpty()
    .withMessage('نام الزامی است')
    .isLength({ min: 2 })
    .withMessage('نام باید حداقل 2 کاراکتر باشد'),
  body('email')
    .isEmail()
    .withMessage('ایمیل معتبر نیست'),
  body('phone')
    .notEmpty()
    .withMessage('شماره تلفن الزامی است'),
  body('position')
    .notEmpty()
    .withMessage('موقعیت شغلی الزامی است'),
  body('stage')
    .notEmpty()
    .withMessage('مرحله الزامی است'),
  body('source')
    .notEmpty()
    .withMessage('منبع الزامی است'),
  body('rating')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('امتیاز باید بین 0 تا 5 باشد')
];

export const validateUpdateCandidate = [
  body('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('نام باید حداقل 2 کاراکتر باشد'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('ایمیل معتبر نیست'),
  body('rating')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('امتیاز باید بین 0 تا 5 باشد')
];

export const validateUpdateStage = [
  body('newStage')
    .notEmpty()
    .withMessage('مرحله جدید الزامی است')
];

