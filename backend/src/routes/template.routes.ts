import { Router } from 'express';
import { getAllTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/template.controller';
import { adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllTemplates);

// Only admins can modify templates
router.post('/', adminMiddleware, createTemplate);
router.put('/:id', adminMiddleware, updateTemplate);
router.delete('/:id', adminMiddleware, deleteTemplate);

export default router;
