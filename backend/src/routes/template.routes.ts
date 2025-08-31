import { Router } from 'express';
import { getAllTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/template.controller';
import { adminMiddleware } from '../middleware/auth.middleware';

export const templateRoutes = Router();

templateRoutes.get('/', getAllTemplates);

// Only admins can modify templates
templateRoutes.post('/', adminMiddleware, createTemplate);
templateRoutes.put('/:id', adminMiddleware, updateTemplate);
templateRoutes.delete('/:id', adminMiddleware, deleteTemplate);
