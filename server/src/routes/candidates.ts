import express from 'express';
import {
  getAllCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  updateCandidateStage,
  analyzeResume,
  validateCreateCandidate,
  validateUpdateCandidate,
  validateUpdateStage
} from '../controllers/candidateController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/candidates - Get all candidates with filters
router.get('/', getAllCandidates);

// GET /api/candidates/:id - Get candidate by ID
router.get('/:id', getCandidateById);

// POST /api/candidates - Create new candidate
router.post('/', validateCreateCandidate, createCandidate);

// PUT /api/candidates/:id - Update candidate
router.put('/:id', validateUpdateCandidate, updateCandidate);

// POST /api/candidates/:id/analyze-resume - Parse/Analyze resume using pdftotext
router.post('/:id/analyze-resume', analyzeResume);

// DELETE /api/candidates/:id - Delete candidate
router.delete('/:id', deleteCandidate);

// PATCH /api/candidates/:id/stage - Update candidate stage
router.patch('/:id/stage', validateUpdateStage, updateCandidateStage);

export default router;





