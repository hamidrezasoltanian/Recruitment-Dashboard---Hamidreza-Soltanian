import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: any;
  timestamp: Date;
  userId?: string;
  requestId?: string;
}

class MonitoringService {
  private logs: LogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory

  // Logging methods
  log(level: LogEntry['level'], message: string, metadata?: any, userId?: string, requestId?: string) {
    const logEntry: LogEntry = {
      level,
      message,
      metadata,
      timestamp: new Date(),
      userId,
      requestId
    };

    this.logs.push(logEntry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, metadata || '');
    }

    // Store in database for production
    if (process.env.NODE_ENV === 'production') {
      this.storeLogInDatabase(logEntry);
    }
  }

  info(message: string, metadata?: any, userId?: string, requestId?: string) {
    this.log('info', message, metadata, userId, requestId);
  }

  warn(message: string, metadata?: any, userId?: string, requestId?: string) {
    this.log('warn', message, metadata, userId, requestId);
  }

  error(message: string, metadata?: any, userId?: string, requestId?: string) {
    this.log('error', message, metadata, userId, requestId);
  }

  debug(message: string, metadata?: any, userId?: string, requestId?: string) {
    this.log('debug', message, metadata, userId, requestId);
  }

  // Performance monitoring
  async trackPerformance(operation: string, duration: number, metadata?: any) {
    this.info(`Performance: ${operation}`, {
      duration,
      operation,
      ...metadata
    });

    // Store performance metrics in database
    try {
      await prisma.performanceMetric.create({
        data: {
          operation,
          duration,
          metadata: JSON.stringify(metadata),
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.error('Failed to store performance metric', { error, operation, duration });
    }
  }

  // Error tracking
  async trackError(error: Error, context?: any, userId?: string, requestId?: string) {
    this.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      userId,
      requestId
    });

    // Store error in database
    try {
      await prisma.errorLog.create({
        data: {
          message: error.message,
          stack: error.stack,
          context: JSON.stringify(context),
          userId,
          requestId,
          timestamp: new Date()
        }
      });
    } catch (dbError) {
      console.error('Failed to store error in database:', dbError);
    }
  }

  // API request tracking
  trackApiRequest(req: Request, res: Response, duration: number) {
    const requestId = req.headers['x-request-id'] as string;
    const userId = (req as any).user?.userId;

    this.info('API Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId,
      requestId
    });
  }

  // Database query tracking
  async trackDatabaseQuery(query: string, duration: number, params?: any) {
    this.debug('Database Query', {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      params
    });

    // Store slow queries
    if (duration > 1000) { // Queries taking more than 1 second
      this.warn('Slow Database Query', {
        query: query.substring(0, 500),
        duration,
        params
      });
    }
  }

  // System health monitoring
  async getSystemHealth() {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      const dbStatus = 'healthy';

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryStatus = memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9 ? 'warning' : 'healthy';

      // Check recent errors
      const recentErrors = await prisma.errorLog.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        }
      });
      const errorStatus = recentErrors > 10 ? 'warning' : 'healthy';

      return {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: dbStatus,
          memory: memoryStatus,
          errors: errorStatus
        },
        metrics: {
          memoryUsage: {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memoryUsage.external / 1024 / 1024) // MB
          },
          recentErrors,
          uptime: process.uptime()
        }
      };
    } catch (error) {
      this.error('Health check failed', { error });
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get recent logs
  getRecentLogs(limit: number = 100, level?: string) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get performance metrics
  async getPerformanceMetrics(startDate?: Date, endDate?: Date) {
    const whereClause: any = {};
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: startDate,
        lte: endDate
      };
    }

    const metrics = await prisma.performanceMetric.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 1000
    });

    // Group by operation
    const groupedMetrics = metrics.reduce((acc, metric) => {
      if (!acc[metric.operation]) {
        acc[metric.operation] = [];
      }
      acc[metric.operation].push(metric.duration);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics
    const statistics = Object.entries(groupedMetrics).map(([operation, durations]) => {
      const sorted = durations.sort((a, b) => a - b);
      const count = durations.length;
      const sum = durations.reduce((a, b) => a + b, 0);
      const avg = sum / count;
      const min = sorted[0];
      const max = sorted[count - 1];
      const median = sorted[Math.floor(count / 2)];
      const p95 = sorted[Math.floor(count * 0.95)];

      return {
        operation,
        count,
        avg: Math.round(avg * 100) / 100,
        min,
        max,
        median,
        p95
      };
    });

    return statistics;
  }

  // Private method to store logs in database
  private async storeLogInDatabase(logEntry: LogEntry) {
    try {
      await prisma.applicationLog.create({
        data: {
          level: logEntry.level,
          message: logEntry.message,
          metadata: JSON.stringify(logEntry.metadata),
          userId: logEntry.userId,
          requestId: logEntry.requestId,
          timestamp: logEntry.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to store log in database:', error);
    }
  }
}

export const monitoringService = new MonitoringService();

// Express middleware for request tracking
export const requestTrackingMiddleware = (req: Request, res: Response, next: any) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to headers
  res.setHeader('X-Request-ID', requestId);
  req.headers['x-request-id'] = requestId;

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    monitoringService.trackApiRequest(req, res, duration);
  });

  next();
};





