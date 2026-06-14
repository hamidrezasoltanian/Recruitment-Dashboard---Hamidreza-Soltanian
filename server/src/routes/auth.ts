import express from 'express';
import {
  login,
  register,
  getProfile,
  changePassword,
  validateLogin,
  validateRegister,
  validateChangePassword
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, validateChangePassword, changePassword);

export default router;





