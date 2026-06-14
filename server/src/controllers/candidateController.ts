import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';
import { ApiResponse, Candidate } from '../types';
import { AuthRequest } from '../middleware/auth';
import { execSync } from 'child_process';
import fs from 'fs';

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

export const analyzeResume = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    const userName = dbUser ? dbUser.name : req.user!.username;

    // 1. Get Candidate with ResumeFile
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        resumeFiles: true
      }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'متقاضی یافت نشد'
      });
    }

    const resumeFile = candidate.resumeFiles[0];
    if (!resumeFile) {
      return res.status(400).json({
        success: false,
        error: 'رزومه‌ای برای این متقاضی یافت نشده است. لطفا ابتدا رزومه را آپلود کنید.'
      });
    }

    if (!fs.existsSync(resumeFile.path)) {
      return res.status(404).json({
        success: false,
        error: 'فایل رزومه روی سرور یافت نشد'
      });
    }

    // 2. Extract Text using pdftotext
    let rawText = '';
    try {
      rawText = execSync(`pdftotext "${resumeFile.path}" -`, { encoding: 'utf-8' });
    } catch (err: any) {
      console.error('pdftotext error:', err);
      return res.status(500).json({
        success: false,
        error: 'خطا در استخراج متن رزومه. لطفا مطمئن شوید فایل PDF سالم است.'
      });
    }

    // 3. Normalize Persian Text
    let text = rawText.normalize('NFKC');
    text = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');

    // 4. Parse Job Hopping
    const durationRegex = /(\d+)\s*\)\s*(?:\d+)?\s*(سال|ماه)(?:\s*و\s*(\d+)?\s*ماه)?/g;
    let match;
    const durations: number[] = [];

    while ((match = durationRegex.exec(text)) !== null) {
      const val1 = parseInt(match[1], 10);
      const type1 = match[2];
      const val2 = match[3] ? parseInt(match[3], 10) : 0;

      let months = 0;
      if (type1 === 'ماه') {
        months = val1;
      } else if (type1 === 'سال') {
        months = val1 * 12 + val2;
      }
      durations.push(months);
    }

    let jobHopping = 'hopping_green';
    if (durations.length > 0) {
      const shortJobsCount = durations.filter(m => m < 12).length;
      const totalJobs = durations.length;
      
      if (totalJobs >= 2 && (shortJobsCount / totalJobs) >= 0.5) {
        jobHopping = 'hopping_red';
      } else if (shortJobsCount > 0) {
        jobHopping = 'hopping_yellow';
      } else {
        jobHopping = 'hopping_green';
      }
    }

    // 5. Parse Relevant Experience and Requested Salary
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let foundHeading = false;
    let totalExperience = '';
    let parsedSalaryRaw = '';

    for (const line of lines) {
      if (line.includes('می زان سابقه کاری') || line.includes('حقوق و سابقه')) {
        foundHeading = true;
      }
      if (foundHeading) {
        if (/^\s*\d+\s*(سال|ماه)\s*$/.test(line) && !totalExperience) {
          totalExperience = line.trim();
        }
        if ((line.includes('میلیون') || line.includes('توم ان') || line.includes('تومان') || line.includes('توافقی')) 
            && !line.includes('تا') && !line.includes(')') && !parsedSalaryRaw) {
          parsedSalaryRaw = line.trim();
        }
      }
    }

    let relevantExperience = 'exp_red';
    if (totalExperience) {
      const yearMatch = totalExperience.match(/(\d+)\s*سال/);
      const monthMatch = totalExperience.match(/(\d+)\s*ماه/);
      let totalMonths = 0;
      if (yearMatch) {
        totalMonths += parseInt(yearMatch[1], 10) * 12;
      }
      if (monthMatch) {
        totalMonths += parseInt(monthMatch[1], 10);
      }

      if (totalMonths > 36) {
        relevantExperience = 'exp_green';
      } else if (totalMonths >= 12) {
        relevantExperience = 'exp_yellow';
      } else {
        relevantExperience = 'exp_red';
      }
    }

    let requestedSalary = '';
    if (parsedSalaryRaw) {
      requestedSalary = parsedSalaryRaw;
    } else {
      // Fallback
      const salaryRegex = /حقوق\s*:\s*([\s\S]*?)(?:تومان|توم\s*ان|ریال)/;
      const salaryMatch = text.match(salaryRegex);
      if (salaryMatch) {
        const cleanSalary = salaryMatch[1].replace(/\s+/g, ' ').trim();
        requestedSalary = `${cleanSalary} تومان`;
      }
    }

    // 7. Update Candidate Evaluation Field
    let currentEval: any = {};
    if (candidate.evaluation) {
      try {
        currentEval = JSON.parse(candidate.evaluation);
      } catch (e) {
        currentEval = {};
      }
    }

    const currentAnswers = currentEval.answers || {};

    const updatedAnswers = {
      ...currentAnswers,
      jobHopping,
      relevantExperience,
      resumeAccuracy: 'عالی',
      requestedSalary
    };

    const updatedEval = {
      ...currentEval,
      evaluatorName: userName,
      evaluatorUsername: req.user!.username,
      candidateName: candidate.name,
      updatedAt: new Date().toISOString(),
      answers: updatedAnswers
    };

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: {
        evaluation: JSON.stringify(updatedEval)
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

    // 8. Add History entry
    await prisma.historyEntry.create({
      data: {
        action: `آنالیز هوشمند رزومه (جاب‌ویژن) انجام شد و فیلدهای ارزیابی اولیه تکمیل گردید`,
        candidateId: id,
        userId
      }
    });

    res.json({
      success: true,
      data: updatedCandidate,
      message: 'آنالیز رزومه با موفقیت انجام شد'
    });
  } catch (error) {
    console.error('Analyze resume error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در آنالیز رزومه متقاضی'
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

