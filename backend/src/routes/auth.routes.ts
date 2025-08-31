import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';

export const authRoutes = Router();

authRoutes.post('/login', login);
// In a real app, registration might be protected or disabled.
// For now, it's open but could be protected by an admin middleware.
authRoutes.post('/register', register);
