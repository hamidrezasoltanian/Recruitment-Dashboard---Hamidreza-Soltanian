import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import {
  cleanPersianSpaces,
  decodeUtf8Filename,
  fixPersianNameSpacing,
  resolveCandidateName,
} from '../utils/persianName';

const prisma = new PrismaClient();
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('نوع فایل مجاز نیست. فقط تصاویر، PDF و اسناد متنی مجاز است.'));
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// POST /api/files/resume/:candidateId - Upload resume
router.post('/resume/:candidateId', upload.single('resume'), async (req, res) => {
  try {
    const { candidateId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'فایل رزومه الزامی است'
      });
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      // Delete uploaded file if candidate doesn't exist
      fs.unlinkSync(file.path);
      return res.status(404).json({
        success: false,
        error: 'متقاضی یافت نشد'
      });
    }

    // Delete old resume if exists
    const oldResume = await prisma.resumeFile.findFirst({
      where: { candidateId }
    });

    if (oldResume) {
      if (fs.existsSync(oldResume.path)) {
        fs.unlinkSync(oldResume.path);
      }
      await prisma.resumeFile.delete({
        where: { id: oldResume.id }
      });
    }

    // Create new resume record
    const resumeFile = await prisma.resumeFile.create({
      data: {
        filename: file.filename,
        originalName: decodeUtf8Filename(file.originalname),
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        candidateId
      }
    });

    // Update candidate hasResume flag
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { hasResume: true }
    });

    res.status(201).json({
      success: true,
      data: resumeFile,
      message: 'رزومه با موفقیت آپلود شد'
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در آپلود رزومه'
    });
  }
});

// GET /api/files/resume/:candidateId - Download resume
router.get('/resume/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;

    const resumeFile = await prisma.resumeFile.findFirst({
      where: { candidateId }
    });

    if (!resumeFile) {
      return res.status(404).json({
        success: false,
        error: 'رزومه یافت نشد'
      });
    }

    if (!fs.existsSync(resumeFile.path)) {
      return res.status(404).json({
        success: false,
        error: 'فایل رزومه در سرور یافت نشد'
      });
    }

    res.download(resumeFile.path, resumeFile.originalName);
  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دانلود رزومه'
    });
  }
});

// DELETE /api/files/resume/:candidateId - Delete resume
router.delete('/resume/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;

    const resumeFile = await prisma.resumeFile.findFirst({
      where: { candidateId }
    });

    if (!resumeFile) {
      return res.status(404).json({
        success: false,
        error: 'رزومه یافت نشد'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(resumeFile.path)) {
      fs.unlinkSync(resumeFile.path);
    }

    // Delete from database
    await prisma.resumeFile.delete({
      where: { id: resumeFile.id }
    });

    // Update candidate hasResume flag
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { hasResume: false }
    });

    res.json({
      success: true,
      message: 'رزومه با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف رزومه'
    });
  }
});

// POST /api/files/test/:candidateId/:testId - Upload test result file
router.post('/test/:candidateId/:testId', upload.single('testFile'), async (req, res) => {
  try {
    const { candidateId, testId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'فایل نتیجه آزمون الزامی است'
      });
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      // Delete uploaded file if candidate doesn't exist
      fs.unlinkSync(file.path);
      return res.status(404).json({
        success: false,
        error: 'متقاضی یافت نشد'
      });
    }

    // Delete old test file if exists
    const oldTestFile = await prisma.testFile.findFirst({
      where: { 
        candidateId,
        testId
      }
    });

    if (oldTestFile) {
      if (fs.existsSync(oldTestFile.path)) {
        fs.unlinkSync(oldTestFile.path);
      }
      await prisma.testFile.delete({
        where: { id: oldTestFile.id }
      });
    }

    // Create new test file record (legacy)
    const testFile = await prisma.testFile.create({
      data: {
        filename: file.filename,
        originalName: decodeUtf8Filename(file.originalname),
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        testId,
        candidateId
      }
    });

    // Update or create corresponding TestResult with the file details
    const existingResult = await prisma.testResult.findFirst({
      where: { candidateId, testId }
    });

    if (existingResult) {
      await prisma.testResult.update({
        where: { id: existingResult.id },
        data: {
          filename: file.filename,
          originalName: decodeUtf8Filename(file.originalname),
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          status: 'review'
        }
      });
    } else {
      await prisma.testResult.create({
        data: {
          candidateId,
          testId,
          filename: file.filename,
          originalName: decodeUtf8Filename(file.originalname),
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          status: 'review'
        }
      });
    }

    res.status(201).json({
      success: true,
      data: testFile,
      message: 'فایل نتیجه آزمون با موفقیت آپلود شد'
    });
  } catch (error) {
    console.error('Upload test file error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در آپلود فایل نتیجه آزمون'
    });
  }
});

// GET /api/files/test/:candidateId/:testId - Download test result file
router.get('/test/:candidateId/:testId', async (req, res) => {
  try {
    const { candidateId, testId } = req.params;

    // Check TestResult first
    const testResult = await prisma.testResult.findFirst({
      where: { candidateId, testId }
    });

    if (testResult && testResult.path && testResult.originalName) {
      if (!fs.existsSync(testResult.path)) {
        return res.status(404).json({
          success: false,
          error: 'فایل نتیجه آزمون در سرور یافت نشد'
        });
      }
      return res.download(testResult.path, testResult.originalName);
    }

    // Fallback to TestFile
    const testFile = await prisma.testFile.findFirst({
      where: { 
        candidateId,
        testId
      }
    });

    if (!testFile) {
      return res.status(404).json({
        success: false,
        error: 'فایل نتیجه آزمون یافت نشد'
      });
    }

    if (!fs.existsSync(testFile.path)) {
      return res.status(404).json({
        success: false,
        error: 'فایل نتیجه آزمون در سرور یافت نشد'
      });
    }

    res.download(testFile.path, testFile.originalName);
  } catch (error) {
    console.error('Download test file error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دانلود فایل نتیجه آزمون'
    });
  }
});

// DELETE /api/files/test/:candidateId/:testId - Delete test result file
router.delete('/test/:candidateId/:testId', async (req, res) => {
  try {
    const { candidateId, testId } = req.params;
    let deletedCount = 0;

    // 1. Clear from TestResult
    const testResult = await prisma.testResult.findFirst({
      where: { candidateId, testId }
    });

    if (testResult && testResult.path) {
      if (fs.existsSync(testResult.path)) {
        fs.unlinkSync(testResult.path);
      }
      await prisma.testResult.update({
        where: { id: testResult.id },
        data: {
          filename: null,
          originalName: null,
          mimeType: null,
          size: null,
          path: null,
          status: 'pending' // revert to pending status
        }
      });
      deletedCount++;
    }

    // 2. Clear from TestFile (legacy)
    const testFile = await prisma.testFile.findFirst({
      where: { 
        candidateId,
        testId
      }
    });

    if (testFile) {
      if (fs.existsSync(testFile.path)) {
        fs.unlinkSync(testFile.path);
      }
      await prisma.testFile.delete({
        where: { id: testFile.id }
      });
      deletedCount++;
    }

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'فایل نتیجه آزمون یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'فایل نتیجه آزمون با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete test file error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف فایل نتیجه آزمون'
    });
  }
});

// POST /api/files/analyze-temp - Analyze a uploaded temp resume file
router.post('/analyze-temp', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'فایل رزومه الزامی است'
      });
    }

    // 2. Extract Text using pdftotext
    let rawText = '';
    let rawLayoutText = '';
    try {
      rawText = execSync(`pdftotext "${file.path}" -`, { encoding: 'utf-8' });
      rawLayoutText = execSync(`pdftotext -layout "${file.path}" -`, { encoding: 'utf-8' });
    } catch (err: any) {
      console.error('pdftotext error:', err);
      // clean up file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(500).json({
        success: false,
        error: 'خطا در استخراج متن رزومه. لطفا مطمئن شوید فایل PDF سالم است.'
      });
    }

    // Clean up temporary file immediately after extracting text!
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // 3. Normalize Persian Text
    let text = rawText.normalize('NFKC');
    text = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');

    let layoutText = rawLayoutText.normalize('NFKC');
    layoutText = layoutText.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');



    // Extract Name, Email, Phone
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const parsedEmail = emailMatch ? emailMatch[0].trim() : '';

    const phoneMatch = text.match(/09\d{9}/) || text.match(/09\d{2}[-\s]*\d{3}[-\s]*\d{4}/);
    const parsedPhone = phoneMatch ? phoneMatch[0].replace(/[-\s]/g, '') : '';

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const originalName = decodeUtf8Filename(file.originalname);
    const parsedName = resolveCandidateName(originalName, text);

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

    res.json({
      success: true,
      data: {
        name: parsedName,
        email: parsedEmail,
        phone: parsedPhone,
        jobHopping,
        relevantExperience,
        requestedSalary
      }
    });

  } catch (error) {
    console.error('Analyze temp resume error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در آنالیز اولیه رزومه'
    });
  }
});

function parseResumeData(text: string, layoutText: string, defaultName: string) {
  // Normalize
  let normText = text.normalize('NFKC');
  normText = normText.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');

  let normLayoutText = layoutText.normalize('NFKC');
  normLayoutText = normLayoutText.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');




  const emailMatch = normText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].trim() : '';

  const phoneMatch = normText.match(/09\d{9}/) || normText.match(/09\d{2}[-\s]*\d{3}[-\s]*\d{4}/);
  const phone = phoneMatch ? phoneMatch[0].replace(/[-\s]/g, '') : '';

  let name = resolveCandidateName(decodeUtf8Filename(defaultName), normText);
  if (!name) {
    name = fixPersianNameSpacing(decodeUtf8Filename(defaultName));
  }

  // Job Hopping
  const durationRegex = /(\d+)\s*\)\s*(?:\d+)?\s*(سال|ماه)(?:\s*و\s*(\d+)?\s*ماه)?/g;
  let match;
  const durations: number[] = [];
  while ((match = durationRegex.exec(normText)) !== null) {
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
    }
  }

  // Experience & Salary
  let parsedExperience = '';
  let parsedSalary = '';
  const layoutLines = normLayoutText.split('\n');
  for (const line of layoutLines) {
    if (line.includes('می زان سابقه کاری') || line.includes('میزان سابقه کاری')) {
      const expMatch = line.match(/(\d+)\s*(سال|ماه)/);
      if (expMatch) parsedExperience = expMatch[0].trim();
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

  let relevantExperience = 'exp_red';
  if (parsedExperience) {
    const yearMatch = parsedExperience.match(/(\d+)\s*سال/);
    const monthMatch = parsedExperience.match(/(\d+)\s*ماه/);
    let totalMonths = 0;
    if (yearMatch) totalMonths += parseInt(yearMatch[1], 10) * 12;
    if (monthMatch) totalMonths += parseInt(monthMatch[1], 10);
    if (totalMonths > 36) {
      relevantExperience = 'exp_green';
    } else if (totalMonths >= 12) {
      relevantExperience = 'exp_yellow';
    }
  }

  let requestedSalary = parsedSalary;
  if (!requestedSalary) {
    const salaryRegex = /حقوق\s*:\s*([\s\S]*?)(?:تومان|توم\s*ان|ریال)/;
    const salaryMatch = normText.match(salaryRegex);
    if (salaryMatch) {
      const cleanSalary = salaryMatch[1].replace(/\s+/g, ' ').trim();
      requestedSalary = `${cleanSalary} تومان`;
    }
  }

  return {
    name,
    email,
    phone,
    jobHopping,
    relevantExperience,
    requestedSalary
  };
}

// POST /api/files/bulk-upload-resumes - Bulk upload and parse resumes
router.post('/bulk-upload-resumes', upload.array('resumes'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'هیچ فایلی ارسال نشده است'
      });
    }

    const addedCandidates: any[] = [];
    const skippedCandidates: any[] = [];
    const errors: any[] = [];

    // Get company profile for job position matching
    const companyProfile = await prisma.companyProfile.findFirst({
      include: { jobPositions: true }
    });

    for (const file of files) {
      try {
        // 1. Extract text using pdftotext
        let rawText = '';
        let rawLayoutText = '';
        try {
          rawText = execSync(`pdftotext "${file.path}" -`, { encoding: 'utf-8' });
          rawLayoutText = execSync(`pdftotext -layout "${file.path}" -`, { encoding: 'utf-8' });
        } catch (err: any) {
          console.error('pdftotext error during bulk:', err);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          errors.push({
            filename: decodeUtf8Filename(file.originalname),
            error: 'خطا در استخراج متن فایل PDF'
          });
          continue;
        }

        // 2. Parse text
        const decodedOriginal = decodeUtf8Filename(file.originalname);
        const defaultName = path.basename(decodedOriginal, path.extname(decodedOriginal));
        const parsed = parseResumeData(rawText, rawLayoutText, defaultName);

        const cleanName = parsed.name ? parsed.name.replace(/\s+/g, ' ').trim() : '';
        const cleanEmail = parsed.email ? parsed.email.replace(/\s+/g, '').trim().toLowerCase() : '';
        const cleanPhone = parsed.phone ? parsed.phone.replace(/\s+/g, '').trim() : '';

        // 3. Duplicate check
        let isDuplicate = false;
        let duplicateReason = '';

        if (cleanEmail) {
          const existingByEmail = await prisma.candidate.findFirst({
            where: { email: cleanEmail }
          });
          if (existingByEmail) {
            isDuplicate = true;
            duplicateReason = `متقاضی با ایمیل ${cleanEmail} از قبل وجود دارد`;
          }
        }

        if (!isDuplicate && cleanPhone) {
          const existingByPhone = await prisma.candidate.findFirst({
            where: { phone: cleanPhone }
          });
          if (existingByPhone) {
            isDuplicate = true;
            duplicateReason = `متقاضی با شماره تلفن ${cleanPhone} از قبل وجود دارد`;
          }
        }

        if (isDuplicate) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          skippedCandidates.push({
            filename: decodeUtf8Filename(file.originalname),
            name: cleanName,
            reason: duplicateReason
          });
          continue;
        }

        // 4. Job position matching
        let position = 'ثبت‌نشده';
        if (companyProfile && companyProfile.jobPositions && companyProfile.jobPositions.length > 0) {
          const textLower = rawText.toLowerCase();
          const matchedJob = companyProfile.jobPositions.find(job => 
            textLower.includes(job.title.toLowerCase())
          );
          if (matchedJob) {
            position = matchedJob.title;
          } else {
            position = companyProfile.jobPositions[0].title;
          }
        }

        // 5. Create Candidate
        // Default evaluation
        const initialEvaluation = {
          jobHopping: parsed.jobHopping,
          relevantExperience: parsed.relevantExperience,
          requestedSalary: parsed.requestedSalary,
          resumeAccuracy: 'متوسط',
          phoneEnergy: 0,
          phoneRoutine: '',
          phoneScenario: '',
          requestedSalaryNum: '',
          phoneResult: '',
          discDominant: [],
          supportFit: '',
          starHonesty: 0,
          starHonestyExample: '',
          starStress: 0,
          starTeamwork: 0,
          rolePlayAccuracy: '',
          rolePlaySpeed: '',
          referenceCheck: '',
          finalDecision: '',
          finalNotes: '',
          evaluatorName: (req as any).user.name,
          updatedAt: new Date().toISOString()
        };

        const candidate = await prisma.candidate.create({
          data: {
            name: cleanName,
            email: cleanEmail || `${Date.now()}@example.com`,
            phone: cleanPhone || '09000000000',
            position,
            stage: 'inbox', // Stage 1 (Inbox)
            source: 'آپلود گروهی رزومه',
            rating: 0,
            hasResume: true,
            evaluation: JSON.stringify(initialEvaluation),
            userId: (req as any).user.userId,
            comments: {
              create: [
                {
                  text: 'این متقاضی از طریق آپلود گروهی رزومه به سیستم اضافه شد.',
                  userId: (req as any).user.userId
                }
              ]
            },
            history: {
              create: [
                {
                  action: 'ثبت متقاضی از طریق آپلود گروهی رزومه',
                  details: 'اطلاعات اولیه با استخراج متن رزومه تکمیل شد.',
                  userId: (req as any).user.userId
                }
              ]
            }
          }
        });

        // 6. Link ResumeFile
        await prisma.resumeFile.create({
          data: {
            filename: file.filename,
            originalName: decodeUtf8Filename(file.originalname),
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
            candidateId: candidate.id
          }
        });

        addedCandidates.push({
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          position: candidate.position
        });

      } catch (err: any) {
        console.error('Error importing single resume:', err);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        errors.push({
          filename: decodeUtf8Filename(file.originalname),
          error: err.message || 'خطای غیرمنتظره در ثبت متقاضی'
        });
      }
    }

    res.json({
      success: true,
      addedCount: addedCandidates.length,
      addedCandidates,
      skippedCandidates,
      errors
    });

  } catch (error: any) {
    console.error('Bulk upload resumes error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در پردازش گروهی رزومه‌ها'
    });
  }
});

export default router;





