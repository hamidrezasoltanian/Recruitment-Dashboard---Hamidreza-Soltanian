import { Router } from 'express';
import {
    getAllCandidates,
    getCandidateById,
    createCandidate,
    updateCandidate,
    deleteCandidate
} from '../controllers/candidate.controller';

export const candidateRoutes = Router();

candidateRoutes.get('/', getAllCandidates);
candidateRoutes.get('/:id', getCandidateById);
candidateRoutes.post('/', createCandidate);
candidateRoutes.put('/:id', updateCandidate);
candidateRoutes.delete('/:id', deleteCandidate);
