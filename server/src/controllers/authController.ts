import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { User, ApiResponse } from '../types';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است'
      });
    }

    // Generate JWT token
    const payload = {
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    };
    const secret = process.env.JWT_SECRET || 'default-secret';
    const options = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
    const token = jwt.sign(payload, secret, options);

    const userResponse: User = {
      id: user.id,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: `خوش آمدید، ${user.name}!`
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ورود به سیستم'
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const { username, name, password, isAdmin = false } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'کاربر با این نام کاربری قبلاً ثبت شده است'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        name,
        password: hashedPassword,
        isAdmin
      }
    });

    const userResponse: User = {
      id: user.id,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'کاربر با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ایجاد کاربر'
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'کاربر یافت نشد'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت اطلاعات کاربر'
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: errors.array()
      });
    }

    const userId = (req as any).user.userId;
    const { oldPassword, newPassword } = req.body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'کاربر یافت نشد'
      });
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: 'رمز عبور فعلی اشتباه است'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تغییر رمز عبور'
    });
  }
};

// Validation rules
export const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('نام کاربری الزامی است')
    .isLength({ min: 3 })
    .withMessage('نام کاربری باید حداقل 3 کاراکتر باشد'),
  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است')
    .isLength({ min: 6 })
    .withMessage('رمز عبور باید حداقل 6 کاراکتر باشد')
];

export const validateRegister = [
  body('username')
    .notEmpty()
    .withMessage('نام کاربری الزامی است')
    .isLength({ min: 3 })
    .withMessage('نام کاربری باید حداقل 3 کاراکتر باشد')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('نام کاربری فقط می‌تواند شامل حروف، اعداد و خط تیره باشد'),
  body('name')
    .notEmpty()
    .withMessage('نام الزامی است')
    .isLength({ min: 2 })
    .withMessage('نام باید حداقل 2 کاراکتر باشد'),
  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است')
    .isLength({ min: 6 })
    .withMessage('رمز عبور باید حداقل 6 کاراکتر باشد')
];

export const validateChangePassword = [
  body('oldPassword')
    .notEmpty()
    .withMessage('رمز عبور فعلی الزامی است'),
  body('newPassword')
    .notEmpty()
    .withMessage('رمز عبور جدید الزامی است')
    .isLength({ min: 6 })
    .withMessage('رمز عبور جدید باید حداقل 6 کاراکتر باشد')
];

