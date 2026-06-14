import express from 'express';
import { PrismaClient } from '@prisma/client';
import { monitoringService } from '../services/monitoringService';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/monitoring/health - System health check
router.get('/health', async (req, res) => {
  try {
    const health = await monitoringService.getSystemHealth();
    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// GET /api/monitoring/metrics - Performance metrics
router.get('/metrics', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const metrics = await monitoringService.getPerformanceMetrics(start, end);
    
    res.json({
      success: true,
      data: {
        period: { start, end },
        metrics
      }
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics'
    });
  }
});

// GET /api/monitoring/logs - Application logs
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const { level, limit = 100 } = req.query;
    
    const logs = monitoringService.getRecentLogs(
      Number(limit),
      level as string
    );
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get logs'
    });
  }
});

// GET /api/monitoring/database - Database performance
router.get('/database', requireAdmin, async (req, res) => {
  try {
    // Database connection test
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - startTime;
    
    // Table statistics
    const tableStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables 
      ORDER BY n_tup_ins DESC
    `;
    
    // Database size
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    
    // Active connections
    const activeConnections = await prisma.$queryRaw`
      SELECT count(*) as connections FROM pg_stat_activity
    `;
    
    res.json({
      success: true,
      data: {
        connectionTime,
        tableStats,
        databaseSize: dbSize,
        activeConnections,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Database monitoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database metrics'
    });
  }
});

// GET /api/monitoring/errors - Error statistics
router.get('/errors', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    const errors = await prisma.errorLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    
    // Error statistics by type
    const errorStats = await prisma.errorLog.groupBy({
      by: ['message'],
      where: whereClause,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });
    
    res.json({
      success: true,
      data: {
        errors,
        statistics: errorStats,
        total: errors.length
      }
    });
  } catch (error) {
    console.error('Get errors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get error statistics'
    });
  }
});

// GET /api/monitoring/analytics - Analytics events
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, action } = req.query;
    
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    if (action) {
      whereClause.action = action;
    }
    
    const events = await prisma.analyticsEvent.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 1000
    });
    
    // Event statistics
    const eventStats = await prisma.analyticsEvent.groupBy({
      by: ['action'],
      where: whereClause,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        events,
        statistics: eventStats,
        total: events.length
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics data'
    });
  }
});

// POST /api/monitoring/test - Run performance test
router.post('/test', requireAdmin, async (req, res) => {
  try {
    const { testType = 'basic' } = req.body;
    
    const startTime = Date.now();
    
    switch (testType) {
      case 'basic':
        // Basic connectivity test
        await prisma.$queryRaw`SELECT 1`;
        break;
        
      case 'candidates':
        // Test candidates query
        await prisma.candidate.findMany({
          take: 10,
          include: {
            comments: true,
            history: true
          }
        });
        break;
        
      case 'analytics':
        // Test analytics query
        await prisma.analyticsEvent.findMany({
          take: 100,
          orderBy: { timestamp: 'desc' }
        });
        break;
        
      default:
        throw new Error('Unknown test type');
    }
    
    const duration = Date.now() - startTime;
    
    // Log the test
    monitoringService.trackPerformance(`test_${testType}`, duration, {
      testType,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      data: {
        testType,
        duration,
        status: 'passed'
      }
    });
  } catch (error) {
    console.error('Performance test error:', error);
    res.status(500).json({
      success: false,
      error: 'Performance test failed'
    });
  }
});

export default router;





