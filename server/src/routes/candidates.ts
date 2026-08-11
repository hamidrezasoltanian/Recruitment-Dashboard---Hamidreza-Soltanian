import express from 'express';
import { PrismaClient } from '@prisma/client';
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
import { positionInclude } from '../data/interviewPlanService';

const prisma = new PrismaClient();
const router = express.Router();

function parseScoreGuide(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

router.use(authenticateToken);

router.get('/', getAllCandidates);

// GET /api/candidates/:id/interview-evaluation
router.get('/:id/interview-evaluation', async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({ where: { id: req.params.id } });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'کاندیدا یافت نشد' });
    }

    const positionTitle = (candidate.position || '').trim();
    const position = await prisma.jobPosition.findFirst({
      where: {
        OR: [
          { title: positionTitle },
          { title: { equals: positionTitle, mode: 'insensitive' } },
        ],
      },
      include: positionInclude,
    });

    const answers = await prisma.interviewQuestionAnswer.findMany({
      where: { candidateId: candidate.id },
    });
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    const sections = (position?.sections || []).map((section) => ({
      ...section,
      questions: (section.questions || []).map((q) => {
        const saved = answerMap.get(q.id);
        return {
          ...q,
          score: saved?.score ?? null,
          comment: saved?.comment ?? '',
        };
      }),
    }));

    res.json({
      success: true,
      data: {
        positionId: position?.id ?? null,
        positionTitle: candidate.position,
        interviewDurationMinutes: position?.interviewDurationMinutes ?? null,
        scoreGuide: parseScoreGuide(position?.scoreGuide),
        sections,
      },
    });
  } catch (error) {
    console.error('Get interview evaluation error:', error);
    res.status(500).json({ success: false, error: 'خطا در دریافت ارزیابی مصاحبه' });
  }
});

// PUT /api/candidates/:id/interview-evaluation
router.put('/:id/interview-evaluation', async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({ where: { id: req.params.id } });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'کاندیدا یافت نشد' });
    }

    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const userId = (req as any).user?.userId as string | undefined;
    const results = [];

    for (const item of answers) {
      if (!item?.questionId) continue;
      const question = await prisma.interviewScriptQuestion.findUnique({ where: { id: item.questionId } });
      if (!question) continue;

      let score: number | null = null;
      if (item.score === null || item.score === undefined || item.score === '') {
        score = null;
      } else {
        const parsed = Number(item.score);
        if (!Number.isFinite(parsed)) continue;
        score = Math.max(0, Math.min(question.maxScore, Math.round(parsed)));
      }

      const comment = typeof item.comment === 'string' ? item.comment.trim() : '';

      const saved = await prisma.interviewQuestionAnswer.upsert({
        where: {
          candidateId_questionId: {
            candidateId: candidate.id,
            questionId: item.questionId,
          },
        },
        create: {
          candidateId: candidate.id,
          questionId: item.questionId,
          score,
          comment: comment || null,
          userId: userId || null,
        },
        update: {
          score,
          comment: comment || null,
          userId: userId || null,
          updatedAt: new Date(),
        },
      });
      results.push(saved);
    }

    res.json({ success: true, data: results, message: 'ارزیابی ذخیره شد' });
  } catch (error) {
    console.error('Save interview evaluation error:', error);
    res.status(500).json({ success: false, error: 'خطا در ذخیره ارزیابی مصاحبه' });
  }
});

router.get('/:id', getCandidateById);
router.post('/', validateCreateCandidate, createCandidate);
router.put('/:id', validateUpdateCandidate, updateCandidate);
router.post('/:id/analyze-resume', analyzeResume);
router.delete('/:id', deleteCandidate);
router.patch('/:id/stage', validateUpdateStage, updateCandidateStage);

export default router;
