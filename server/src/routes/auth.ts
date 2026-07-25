import express from 'express';
import {
  login,
  register,
  getProfile,
  changePassword,
  validateLogin,
  validateRegister,
  validateChangePassword,
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, validateChangePassword, changePassword);

// User management (Admin only operations, but listing users is allowed for all authenticated users)
router.get('/users', authenticateToken, getAllUsers);
router.put('/users/:username', authenticateToken, requireAdmin, updateUser);
router.delete('/users/:username', authenticateToken, requireAdmin, deleteUser);

export default router;





