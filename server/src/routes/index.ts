import express from 'express';
import authRoutes from './auth';
import candidateRoutes from './candidates';
import commentRoutes from './comments';
import stageRoutes from './stages';
import templateRoutes from './templates';
import settingsRoutes from './settings';
import fileRoutes from './files';
import analyticsRoutes from './analytics';
import notificationRoutes from './notifications';
import monitoringRoutes from './monitoring';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/candidates', candidateRoutes);
router.use('/comments', commentRoutes);
router.use('/stages', stageRoutes);
router.use('/templates', templateRoutes);
router.use('/settings', settingsRoutes);
router.use('/files', fileRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/monitoring', monitoringRoutes);

export default router;
