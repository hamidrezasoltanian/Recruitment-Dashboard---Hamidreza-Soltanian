import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const prisma = new PrismaClient();

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate = new Date().toISOString()
    } = req.query;

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Basic metrics
    const totalCandidates = await prisma.candidate.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const activeCandidates = await prisma.candidate.count({
      where: {
        stage: {
          notIn: ['hired', 'rejected', 'archived']
        },
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const hiredCandidates = await prisma.candidate.count({
      where: {
        stage: 'hired',
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const rejectedCandidates = await prisma.candidate.count({
      where: {
        stage: 'rejected',
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    // Conversion rate
    const conversionRate = totalCandidates > 0 ? (hiredCandidates / totalCandidates) * 100 : 0;

    // Time to hire analysis
    const hiredCandidatesWithDates = await prisma.candidate.findMany({
      where: {
        stage: 'hired',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    const avgTimeToHire = hiredCandidatesWithDates.length > 0
      ? hiredCandidatesWithDates.reduce((sum, c) => {
          const timeDiff = c.updatedAt.getTime() - c.createdAt.getTime();
          return sum + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / hiredCandidatesWithDates.length
      : 0;

    // Source effectiveness
    const sourceStats = await prisma.candidate.groupBy({
      by: ['source'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: {
        id: true
      }
    });

    // Stage distribution
    const stageStats = await prisma.candidate.groupBy({
      by: ['stage'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: {
        id: true
      }
    });

    // Rating distribution
    const ratingStats = await prisma.candidate.groupBy({
      by: ['rating'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: {
        id: true
      }
    });

    // Monthly trends
    const monthlyTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count,
        COUNT(CASE WHEN stage = 'hired' THEN 1 END) as hired_count
      FROM "candidates"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    `;

    res.json({
      success: true,
      data: {
        totalCandidates,
        activeCandidates,
        hiredCandidates,
        rejectedCandidates,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgTimeToHire: Math.round(avgTimeToHire * 100) / 100,
        sourceStats: sourceStats.map(s => ({
          source: s.source,
          count: s._count.id
        })),
        stageStats: stageStats.map(s => ({
          stage: s.stage,
          count: s._count.id
        })),
        ratingStats: ratingStats.map(r => ({
          rating: r.rating,
          count: r._count.id
        })),
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت آمار داشبورد'
    });
  }
};

export const getCandidateAnalytics = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        history: {
          orderBy: { createdAt: 'desc' }
        },
        comments: {
          orderBy: { createdAt: 'desc' }
        },
        testResults: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'متقاضی یافت نشد'
      });
    }

    // Calculate time in each stage
    const stageTimes = [];
    let currentStage = candidate.stage;
    let stageStartTime = new Date(candidate.createdAt);

    for (const historyEntry of candidate.history) {
      if (historyEntry.action.includes('مرحله به')) {
        const stageEndTime = new Date(historyEntry.createdAt);
        const timeInStage = stageEndTime.getTime() - stageStartTime.getTime();
        
        stageTimes.push({
          stage: currentStage,
          duration: Math.round(timeInStage / (1000 * 60 * 60 * 24) * 100) / 100, // Days
          startDate: stageStartTime,
          endDate: stageEndTime
        });

        stageStartTime = stageEndTime;
        currentStage = historyEntry.action.match(/مرحله به "([^"]+)"/)?.[1] || currentStage;
      }
    }

    // Add current stage time
    const currentStageTime = new Date().getTime() - stageStartTime.getTime();
    stageTimes.push({
      stage: currentStage,
      duration: Math.round(currentStageTime / (1000 * 60 * 60 * 24) * 100) / 100,
      startDate: stageStartTime,
      endDate: null
    });

    // Test performance
    const testPerformance = candidate.testResults.map(test => ({
      testId: test.testId,
      status: test.status,
      score: test.score,
      sentDate: test.sentDate,
      completedDate: test.status === 'passed' || test.status === 'failed' ? test.updatedAt : null
    }));

    res.json({
      success: true,
      data: {
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          position: candidate.position,
          stage: candidate.stage,
          rating: candidate.rating,
          createdAt: candidate.createdAt
        },
        stageTimes,
        testPerformance,
        totalHistoryEntries: candidate.history.length,
        totalComments: candidate.comments.length,
        totalTests: candidate.testResults.length
      }
    });
  } catch (error) {
    console.error('Get candidate analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت آمار متقاضی'
    });
  }
};

export const getPerformanceReport = async (req: Request, res: Response) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate = new Date().toISOString(),
      groupBy = 'day'
    } = req.query;

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Performance metrics by time period
    let groupByClause: string;
    switch (groupBy) {
      case 'hour':
        groupByClause = "DATE_TRUNC('hour', \"createdAt\")";
        break;
      case 'day':
        groupByClause = "DATE_TRUNC('day', \"createdAt\")";
        break;
      case 'week':
        groupByClause = "DATE_TRUNC('week', \"createdAt\")";
        break;
      case 'month':
        groupByClause = "DATE_TRUNC('month', \"createdAt\")";
        break;
      default:
        groupByClause = "DATE_TRUNC('day', \"createdAt\")";
    }

    const performanceData = await prisma.$queryRaw`
      SELECT 
        ${groupByClause} as period,
        COUNT(*) as total_candidates,
        COUNT(CASE WHEN stage = 'hired' THEN 1 END) as hired_count,
        COUNT(CASE WHEN stage = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN stage NOT IN ('hired', 'rejected', 'archived') THEN 1 END) as active_count,
        ROUND(
          (COUNT(CASE WHEN stage = 'hired' THEN 1 END)::float / NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as conversion_rate
      FROM "candidates"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY ${groupByClause}
      ORDER BY period
    `;

    // Top performing sources
    const topSources = await prisma.candidate.groupBy({
      by: ['source'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: {
        id: true
      },
      _avg: {
        rating: true
      }
    });

    // Stage conversion rates
    const stageConversions = await prisma.$queryRaw`
      SELECT 
        stage,
        COUNT(*) as total,
        COUNT(CASE WHEN "updatedAt" > "createdAt" THEN 1 END) as moved,
        ROUND(
          (COUNT(CASE WHEN "updatedAt" > "createdAt" THEN 1 END)::float / NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as conversion_rate
      FROM "candidates"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY stage
      ORDER BY total DESC
    `;

    res.json({
      success: true,
      data: {
        performanceData,
        topSources: topSources.map(s => ({
          source: s.source,
          count: s._count.id,
          avgRating: Math.round((s._avg.rating || 0) * 100) / 100
        })),
        stageConversions
      }
    });
  } catch (error) {
    console.error('Get performance report error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت گزارش عملکرد'
    });
  }
};

export const exportData = async (req: Request, res: Response) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true
          }
        },
        comments: true,
        history: true,
        testResults: true
      }
    });

    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = 'Name,Email,Phone,Position,Stage,Source,Rating,Created At,Interview Date,Interview Time\n';
      const csvData = candidates.map(c => 
        `"${c.name}","${c.email}","${c.phone}","${c.position}","${c.stage}","${c.source}","${c.rating}","${c.createdAt.toISOString()}","${c.interviewDate || ''}","${c.interviewTime || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=candidates.csv');
      res.send(csvHeader + csvData);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=candidates.json');
      res.json(candidates);
    } else {
      res.status(400).json({
        success: false,
        error: 'فرمت پشتیبانی نشده. از csv یا json استفاده کنید.'
      });
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در صادرات داده‌ها'
    });
  }
};





