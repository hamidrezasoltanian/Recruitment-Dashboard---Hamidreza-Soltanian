import { Router } from 'express';
import { 
    getAllUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    getCurrentUser, 
    updateCurrentUser 
} from '../controllers/user.controller';
import { adminMiddleware } from '../middleware/auth.middleware';

export const userRoutes = Router();

// Get current logged-in user's info
userRoutes.get('/me', getCurrentUser);
userRoutes.put('/me', updateCurrentUser);

// Admin-only routes for managing all users
userRoutes.get('/', adminMiddleware, getAllUsers);
userRoutes.post('/', adminMiddleware, createUser);
userRoutes.put('/:id', adminMiddleware, updateUser);
userRoutes.delete('/:id', adminMiddleware, deleteUser);
