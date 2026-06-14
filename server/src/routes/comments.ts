import express from 'express';
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  addHistoryEntry,
  validateAddComment,
  validateUpdateComment,
  validateAddHistoryEntry
} from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Comments routes
router.post('/candidates/:candidateId', validateAddComment, addComment);
router.get('/candidates/:candidateId', getComments);
router.put('/:commentId', validateUpdateComment, updateComment);
router.delete('/:commentId', deleteComment);

// History routes
router.post('/candidates/:candidateId/history', validateAddHistoryEntry, addHistoryEntry);

export default router;





