import { Router } from 'express';
import {
    getAllCandidates,
    getCandidateById,
    createCandidate,
    updateCandidate,
    deleteCandidate
} from '../controllers/candidate.controller';

const router = Router();

router.get('/', getAllCandidates);
router.get('/:id', getCandidateById);
router.post('/', createCandidate);
router.put('/:id', updateCandidate);
router.delete('/:id', deleteCandidate);

export default router;
