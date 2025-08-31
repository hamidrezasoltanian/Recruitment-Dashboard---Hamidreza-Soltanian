import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { adminMiddleware } from '../middleware/auth.middleware';

export const settingsRoutes = Router();

settingsRoutes.get('/', getSettings);
settingsRoutes.put('/', adminMiddleware, updateSettings); // Only admins can update settings
