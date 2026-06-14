import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

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
        originalName: file.originalname,
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

    // Create new test file record
    const testFile = await prisma.testFile.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        testId,
        candidateId
      }
    });

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

    // Delete file from filesystem
    if (fs.existsSync(testFile.path)) {
      fs.unlinkSync(testFile.path);
    }

    // Delete from database
    await prisma.testFile.delete({
      where: { id: testFile.id }
    });

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

export default router;





