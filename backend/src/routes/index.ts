
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import candidateRoutes from './candidate.routes';
import userRoutes from './user.routes';
import settingsRoutes from './settings.routes';
import templateRoutes from './template.routes';

const router = Router();

// --- Public Routes ---
// Routes under /api/auth do not require authentication
router.use('/auth', authRoutes);

// --- Protected Routes ---
// All routes defined below will be protected by the authMiddleware
router.use('/candidates', authMiddleware, candidateRoutes);
router.use('/users', authMiddleware, userRoutes);
router.use('/settings', authMiddleware, settingsRoutes);
router.use('/templates', authMiddleware, templateRoutes);

export default router;
