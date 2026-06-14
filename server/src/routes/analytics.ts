import express from 'express';
import {
  getDashboardMetrics,
  getCandidateAnalytics,
  getPerformanceReport,
  exportData
} from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/analytics/dashboard - Get dashboard metrics
router.get('/dashboard', getDashboardMetrics);

// GET /api/analytics/candidate/:id - Get candidate analytics
router.get('/candidate/:id', getCandidateAnalytics);

// GET /api/analytics/performance - Get performance report
router.get('/performance', getPerformanceReport);

// GET /api/analytics/export - Export data
router.get('/export', exportData);

export default router;





