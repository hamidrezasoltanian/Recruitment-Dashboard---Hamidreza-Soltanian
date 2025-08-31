import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { candidateRoutes } from './candidate.routes';
import { userRoutes } from './user.routes';
import { settingsRoutes } from './settings.routes';
import { templateRoutes } from './template.routes';
import { authMiddleware } from '../middleware/auth.middleware';

const apiRouter = Router();

// Public health check
apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Public routes
apiRouter.use('/auth', authRoutes);

// Protected routes
apiRouter.use('/candidates', authMiddleware, candidateRoutes);
apiRouter.use('/users', authMiddleware, userRoutes);
apiRouter.use('/settings', authMiddleware, settingsRoutes);
apiRouter.use('/templates', authMiddleware, templateRoutes);

export { apiRouter };