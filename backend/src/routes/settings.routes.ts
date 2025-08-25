import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getSettings);
router.put('/', adminMiddleware, updateSettings); // Only admins can update settings

export default router;
