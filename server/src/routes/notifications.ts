import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get notifications for a user
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.notification.count({ where });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت اعلان‌ها'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req: any, res: any) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId
      },
      data: { read: true }
    });

    if (notification.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'اعلان یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'اعلان به عنوان خوانده شده علامت‌گذاری شد'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در به‌روزرسانی اعلان'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'همه اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در به‌روزرسانی اعلان‌ها'
    });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    const notification = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'اعلان یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'اعلان حذف شد'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف اعلان'
    });
  }
});

// Get notification count
router.get('/count', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false }
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error getting notification count:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت تعداد اعلان‌ها'
    });
  }
});

export default router;