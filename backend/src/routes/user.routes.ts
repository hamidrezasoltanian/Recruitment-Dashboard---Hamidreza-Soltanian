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

const router = Router();

// Get current logged-in user's info
router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUser);

// Admin-only routes for managing all users
router.get('/', adminMiddleware, getAllUsers);
router.post('/', adminMiddleware, createUser);
router.put('/:id', adminMiddleware, updateUser);
router.delete('/:id', adminMiddleware, deleteUser);

export default router;
