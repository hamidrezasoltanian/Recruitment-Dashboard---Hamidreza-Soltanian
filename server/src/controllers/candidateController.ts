import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';
import { ApiResponse, Candidate } from '../types';
import { AuthRequest } from '../middleware/auth';
import { execSync } from 'child_process';
import fs from 'fs';
import { emailService } from '../services/emailService';
import {
  cleanPersianSpaces,
  resolveCandidateName,
} from '../utils/persianName';

const prisma = new PrismaClient();

const mapCandidate = (candidate: any) => {
  if (!candidate) return candidate;
  return {
    ...candidate,
    testResults: candidate.testResults?.map((tr: any) => ({
      ...tr,
      file: tr.originalName ? { name: tr.originalName, type: tr.mimeType } : undefined
    }))
  };
};

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
      data: candidates.map(mapCandidate)
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
      data: mapCandidate(candidate)
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
      interviewer,
      evaluation
    } = req.body;

    const cleanName = name ? name.replace(/\s+/g, ' ').trim() : '';
    const cleanEmail = email ? email.replace(/\s+/g, '').trim().toLowerCase() : '';
    const cleanPhone = phone ? phone.replace(/\s+/g, '').trim() : '';

    if (cleanEmail) {
      const existingByEmail = await prisma.candidate.findFirst({
        where: { email: cleanEmail }
      });
      if (existingByEmail) {
        return res.status(400).json({
          success: false,
          error: `متقاضی با ایمیل ${cleanEmail} از قبل در سیستم وجود دارد.`
        });
      }
    }

    if (cleanPhone) {
      const existingByPhone = await prisma.candidate.findFirst({
        where: { phone: cleanPhone }
      });
      if (existingByPhone) {
        return res.status(400).json({
          success: false,
          error: `متقاضی با شماره تلفن ${cleanPhone} از قبل در سیستم وجود دارد.`
        });
      }
    }

    const candidate = await prisma.candidate.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        position,
        stage,
        source,
        rating,
        interviewDate,
        interviewTime,
        interviewTimeChanged,
        interviewer,
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
      data: mapCandidate(candidate),
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

    // Process testResults if provided
    if (updateData.testResults && Array.isArray(updateData.testResults)) {
      for (const resItem of updateData.testResults) {
        const existingResult = await prisma.testResult.findFirst({
          where: {
            candidateId: id,
            testId: resItem.testId
          }
        });
        
        let shouldSendEmail = false;

        if (existingResult) {
          if (resItem.status === 'pending' && existingResult.status !== 'pending') {
            shouldSendEmail = true;
          }
          await prisma.testResult.update({
            where: { id: existingResult.id },
            data: {
              status: resItem.status,
              score: resItem.score !== undefined ? resItem.score : undefined,
              notes: resItem.notes !== undefined ? resItem.notes : undefined,
              sentDate: resItem.sentDate ? new Date(resItem.sentDate) : undefined,
              deadlineHours: resItem.deadlineHours !== undefined ? resItem.deadlineHours : undefined
            }
          });
        } else {
          if (resItem.status === 'pending') {
            shouldSendEmail = true;
          }
          await prisma.testResult.create({
            data: {
              candidateId: id,
              testId: resItem.testId,
              status: resItem.status || 'not_sent',
              score: resItem.score,
              notes: resItem.notes,
              sentDate: resItem.sentDate ? new Date(resItem.sentDate) : undefined,
              deadlineHours: resItem.deadlineHours
            }
          });
        }

        if (shouldSendEmail) {
          try {
            const candidateObj = await prisma.candidate.findUnique({ where: { id } });
            const testObj = await prisma.testLibraryItem.findUnique({ where: { id: resItem.testId } });
            
            if (candidateObj && candidateObj.email && testObj) {
              const company = await prisma.companyProfile.findFirst() || { name: 'شرکت ما', website: '', address: '', phone: '' };
              
              const subject = `دعوت به آزمون ${testObj.name} - ${candidateObj.name}`;
              const htmlContent = `
                <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
                  <h2>سلام ${candidateObj.name} عزیز،</h2>
                  <p>برای ادامه فرآیند ارزیابی موقعیت شغلی «<strong>${candidateObj.position}</strong>»، از شما دعوت می‌شود تا آزمون زیر را تکمیل نمایید:</p>
                  <div style="background-color: #f5f5f5; border-right: 4px solid #007bff; padding: 15px; margin: 20px 0;">
                    <strong>عنوان آزمون:</strong> ${testObj.name}<br/>
                    <strong>لینک آزمون:</strong> <a href="${testObj.url}" target="_blank" style="color: #007bff; text-decoration: underline;">شروع آزمون</a>
                  </div>
                  <p>اگر سوالی داشتید، همین ایمیل را پاسخ دهید.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                  <p style="font-size: 12px; color: #777;">با آرزوی بهترین‌ها،<br/>تیم جذب و استخدام ${company.name}<br/>وب‌سایت: ${company.website || ''}<br/>آدرس: ${company.address || ''}<br/>تلفن: ${company.phone || ''}</p>
                </div>
              `;
              
              await emailService.sendEmail({
                to: candidateObj.email,
                subject,
                content: `دعوت به آزمون ${testObj.name}. لطفا وارد لینک زیر شوید:\n${testObj.url}`,
                html: htmlContent
              });
              console.log(`Test email successfully sent to ${candidateObj.email} for test ${testObj.name}`);
            }
          } catch (emailErr) {
            console.error('Failed to send test email:', emailErr);
          }
        }
      }
    }

    // Only update scalar fields - exclude relations and computed fields
    const { name, email, phone, position, source, stage, rating,
            interviewDate, interviewTime, interviewTimeChanged, interviewer, hasResume, evaluation } = updateData;

    const cleanName = name !== undefined ? name.replace(/\s+/g, ' ').trim() : undefined;
    const cleanEmail = email !== undefined ? email.replace(/\s+/g, '').trim().toLowerCase() : undefined;
    const cleanPhone = phone !== undefined ? phone.replace(/\s+/g, '').trim() : undefined;

    if (cleanEmail) {
      const existingByEmail = await prisma.candidate.findFirst({
        where: { email: cleanEmail, id: { not: id } }
      });
      if (existingByEmail) {
        return res.status(400).json({
          success: false,
          error: `متقاضی دیگری با ایمیل ${cleanEmail} از قبل وجود دارد.`
        });
      }
    }

    if (cleanPhone) {
      const existingByPhone = await prisma.candidate.findFirst({
        where: { phone: cleanPhone, id: { not: id } }
      });
      if (existingByPhone) {
        return res.status(400).json({
          success: false,
          error: `متقاضی دیگری با شماره تلفن ${cleanPhone} از قبل وجود دارد.`
        });
      }
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        ...(cleanName !== undefined && { name: cleanName }),
        ...(cleanEmail !== undefined && { email: cleanEmail }),
        ...(cleanPhone !== undefined && { phone: cleanPhone }),
        ...(position !== undefined && { position }),
        ...(source !== undefined && { source }),
        ...(stage !== undefined && { stage }),
        ...(rating !== undefined && { rating }),
        ...(interviewDate !== undefined && { interviewDate }),
        ...(interviewTime !== undefined && { interviewTime }),
        ...(interviewTimeChanged !== undefined && { interviewTimeChanged }),
        ...(interviewer !== undefined && { interviewer }),
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
      data: mapCandidate(candidate),
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
      data: mapCandidate(candidate),
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
    let rawLayoutText = '';
    try {
      rawText = execSync(`pdftotext "${resumeFile.path}" -`, { encoding: 'utf-8' });
      rawLayoutText = execSync(`pdftotext -layout "${resumeFile.path}" -`, { encoding: 'utf-8' });
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

    let layoutText = rawLayoutText.normalize('NFKC');
    layoutText = layoutText.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');

    // Helper to check placeholders
    const isPlaceholderOrEmpty = (str: string | null | undefined): boolean => {
      if (!str) return true;
      const s = str.trim().toLowerCase();
      return (
        s === '' ||
        s === 'new candidate' ||
        s === 'متقاضی جدید' ||
        s === 'ثبت نشده' ||
        s === 'بدون نام' ||
        s === 'new' ||
        s.length <= 2
      );
    };

    // Extract Name, Email, Phone
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const parsedEmail = emailMatch ? emailMatch[0].trim() : '';

    const phoneMatch = text.match(/09\d{9}/) || text.match(/09\d{2}[-\s]*\d{3}[-\s]*\d{4}/);
    const parsedPhone = phoneMatch ? phoneMatch[0].replace(/[-\s]/g, '') : '';

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedName = resolveCandidateName(resumeFile.originalName, text);

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
    let parsedExperience = '';
    let parsedSalary = '';

    const layoutLines = layoutText.split('\n');
    for (const line of layoutLines) {
      if (line.includes('می زان سابقه کاری') || line.includes('میزان سابقه کاری')) {
        const expMatch = line.match(/(\d+)\s*(سال|ماه)/);
        if (expMatch) {
          parsedExperience = expMatch[0].trim();
        }
      }
      if (line.includes('حقوق') && !line.includes('حقوق و سابقه')) {
        const parts = line.split(/حقوق\s*:/);
        if (parts.length > 1) {
          const leftPart = parts[0].trim();
          const salaryMatch = leftPart.match(/(\d+\s*-\s*\d+\s*میلیون\s*توم\s*ان)|(\d+\s*-\s*\d+\s*میلیون\s*تومان)|(توافقی)/);
          if (salaryMatch) {
            parsedSalary = cleanPersianSpaces(salaryMatch[0]);
          } else {
            parsedSalary = cleanPersianSpaces(leftPart.split(/\s{2,}/).pop() || '');
          }
        }
      }
    }

    // Fallbacks if layout mode failed to extract
    if (!parsedExperience) {
      let foundHeading = false;
      for (const line of lines) {
        if (line.includes('می زان سابقه کاری') || line.includes('حقوق و سابقه')) {
          foundHeading = true;
        }
        if (foundHeading && /^\s*\d+\s*(سال|ماه)\s*$/.test(line)) {
          parsedExperience = cleanPersianSpaces(line);
          break;
        }
      }
    }

    if (!parsedSalary) {
      let foundHeading = false;
      for (const line of lines) {
        if (line.includes('می زان سابقه کاری') || line.includes('حقوق و سابقه')) {
          foundHeading = true;
        }
        if (foundHeading && (line.includes('میلیون') || line.includes('تومان') || line.includes('توافقی')) && !line.includes('تا') && !line.includes(')')) {
          parsedSalary = cleanPersianSpaces(line);
          break;
        }
      }
    }

    let relevantExperience = 'exp_red';
    if (parsedExperience) {
      const yearMatch = parsedExperience.match(/(\d+)\s*سال/);
      const monthMatch = parsedExperience.match(/(\d+)\s*ماه/);
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

    let requestedSalary = parsedSalary;
    if (!requestedSalary) {
      const salaryRegex = /حقوق\s*:\s*([\s\S]*?)(?:تومان|توم\s*ان|ریال)/;
      const salaryMatch = text.match(salaryRegex);
      if (salaryMatch) {
        const cleanSalary = salaryMatch[1].replace(/\s+/g, ' ').trim();
        requestedSalary = `${cleanSalary} تومان`;
      }
    }

    // 7. Update Candidate Evaluation Field and main fields (name, email, phone) if empty/placeholder
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

    const updateData: any = {
      evaluation: JSON.stringify(updatedEval)
    };

    // Update candidate main fields if they are placeholders/empty
    if (parsedName && isPlaceholderOrEmpty(candidate.name)) {
      updateData.name = parsedName;
      updatedEval.candidateName = parsedName; // Sync the evaluation candidate name too
      updateData.evaluation = JSON.stringify(updatedEval);
    }
    if (parsedEmail && (isPlaceholderOrEmpty(candidate.email) || !candidate.email.includes('@'))) {
      updateData.email = parsedEmail;
    }
    if (parsedPhone && (isPlaceholderOrEmpty(candidate.phone) || candidate.phone.length < 10)) {
      updateData.phone = parsedPhone;
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
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
    .withMessage('امتیاز باید بین 0 تا 5 باشد'),
  body('interviewer')
    .custom((value, { req }) => {
      if (req.body.interviewDate && !value) {
        throw new Error('انتخاب مصاحبه‌کننده برای تعیین زمان مصاحبه الزامی است');
      }
      return true;
    })
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
    .withMessage('امتیاز باید بین 0 تا 5 باشد'),
  body('interviewer')
    .custom((value, { req }) => {
      if (req.body.interviewDate && !value) {
        throw new Error('انتخاب مصاحبه‌کننده برای تعیین زمان مصاحبه الزامی است');
      }
      return true;
    })
];

export const validateUpdateStage = [
  body('newStage')
    .notEmpty()
    .withMessage('مرحله جدید الزامی است')
];

