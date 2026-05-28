import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Candidate, StageId, Comment, HistoryEntry, TestResult, ScorecardEntry } from '../types';
import { dbService } from '../services/dbService';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

interface CandidatesContextType {
  candidates: Candidate[];
  setCandidates: (candidates: Candidate[], suppressToast?: boolean) => Promise<void>;
  addCandidate: (candidate: Candidate, resumeFile?: File) => Promise<void>;
  updateCandidate: (candidate: Candidate, resumeFile?: File) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  updateCandidateStage: (id: string, newStageId: StageId, newStageTitle?: string) => Promise<void>;
  unarchiveCandidate: (id: string) => Promise<void>;
  addComment: (id: string, comment: Comment) => Promise<void>;
  addCustomHistoryEntry: (id: string, actionText: string) => void;
  updateTestResult: (candidateId: string, testId: string, resultData: Partial<TestResult>) => Promise<void>;
  updateScorecard: (candidateId: string, entry: ScorecardEntry) => Promise<void>;
  lastDeleted: Candidate | null;
  undoDelete: () => Promise<void>;
}

declare const persianDate: any;

const CandidatesContext = createContext<CandidatesContextType | undefined>(undefined);

export const useCandidates = () => {
  const context = useContext(CandidatesContext);
  if (!context) {
    throw new Error('useCandidates must be used within a CandidatesProvider');
  }
  return context;
};

const defaultCandidate: Candidate = {
    id: 'cand_default_h_soltanian',
    name: 'حمیدرضا سلطانیان',
    email: 'hamidreza.soltanian@gmail.com',
    phone: '09125100121',
    position: 'توسعه‌دهنده ارشد React',
    stage: 'interview-1',
    source: 'معرفی‌شده',
    rating: 5,
    createdAt: new Date().toISOString(),
    stageEnteredAt: new Date().toISOString(),
    interviewDate: new persianDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).format('YYYY/MM/DD'),
    interviewTime: '14:30',
    interviewTimeChanged: true,
    history: [{
        user: 'سیستم',
        action: 'متقاضی پیش‌فرض ایجاد شد',
        timestamp: new Date().toISOString()
    }],
    comments: [{ id: '1', user: 'Admin', text: 'کاندیدای بسیار قوی، حتما مصاحبه شود.', timestamp: new Date().toISOString() }],
    hasResume: true,
    testResults: [
        { testId: 'test-1', status: 'passed', score: 95, notes: 'تحلیل روانشناسی مثبت بود', file: { name: 'archetype_result.pdf', type: 'application/pdf' } },
        { testId: 'test-2', status: 'pending', sentDate: new Date().toISOString() }
    ]
};


export const CandidatesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [candidates, setCandidatesState] = useState<Candidate[]>([]);
  const [lastDeleted, setLastDeleted] = useState<Candidate | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dbService.getAllCandidates();
        if (data.length === 0) {
          await dbService.saveCandidate(defaultCandidate);
          setCandidatesState([defaultCandidate]);
          addToast('متقاضی پیش‌فرض برای تست اضافه شد.', 'success');
        } else {
          setCandidatesState(data);
        }
      } catch (error) {
        console.error("Failed to load candidates from DB", error);
        addToast('خطا در بارگذاری داده‌ها از پایگاه داده.', 'error');
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addHistoryEntry = useCallback((candidate: Candidate, action: string, details?: string): Candidate => {
    if (!user) return candidate;
    const historyEntry: HistoryEntry = {
      user: user.name,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    return { ...candidate, history: [historyEntry, ...candidate.history] };
  }, [user]);

  const setCandidates = async (newCandidates: Candidate[], suppressToast = false) => {
    try {
        await dbService.clearAllCandidates();
        for (const candidate of newCandidates) {
            await dbService.saveCandidate(candidate);
        }
        setCandidatesState(newCandidates);
        if (!suppressToast) {
            addToast('لیست متقاضیان با موفقیت بازیابی شد.', 'success');
        }
    } catch (error) {
        addToast('خطا در ذخیره سازی داده‌های متقاضیان.', 'error');
    }
  };

  const addCandidate = async (candidate: Candidate, resumeFile?: File) => {
    const candidateWithHistory = addHistoryEntry(candidate, 'متقاضی ایجاد شد');
    const newCandidate = { ...candidateWithHistory, testResults: [], stageEnteredAt: new Date().toISOString() };
    try {
      await dbService.saveCandidate(newCandidate);
      if (resumeFile) await dbService.saveResume(candidate.id, resumeFile);
      setCandidatesState(prev => [...prev, newCandidate]);
      addToast('متقاضی با موفقیت اضافه شد.', 'success');
    } catch (error) {
      addToast('خطا در افزودن متقاضی.', 'error');
    }
  };

  const updateCandidate = async (candidate: Candidate, resumeFile?: File) => {
    const candidateWithHistory = addHistoryEntry(candidate, 'اطلاعات ویرایش شد');
    try {
      await dbService.saveCandidate(candidateWithHistory);
      if (resumeFile) await dbService.saveResume(candidate.id, resumeFile);
      setCandidatesState(prev => prev.map(c => c.id === candidate.id ? candidateWithHistory : c));
      addToast('اطلاعات با موفقیت به‌روزرسانی شد.', 'success');
    } catch (error) {
      addToast('خطا در به‌روزرسانی اطلاعات.', 'error');
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      const candidate = candidates.find(c => c.id === id);
      await dbService.deleteCandidate(id);
      await dbService.deleteResume(id);
      if (candidate?.testResults) {
        for (const result of candidate.testResults) {
          if (result.file) {
            await dbService.deleteTestFile(`${candidate.id}_${result.testId}`);
          }
        }
      }
      if (candidate) setLastDeleted(candidate);
      setCandidatesState(prev => prev.filter(c => c.id !== id));
      addToast('متقاضی حذف شد. می‌توانید بازگردانید.', 'success');
    } catch (error) {
      addToast('خطا در حذف متقاضی.', 'error');
    }
  };

  const undoDelete = async () => {
    if (!lastDeleted) return;
    try {
      await dbService.saveCandidate(lastDeleted);
      setCandidatesState(prev => [...prev, lastDeleted]);
      setLastDeleted(null);
      addToast(`متقاضی "${lastDeleted.name}" بازگردانده شد.`, 'success');
    } catch {
      addToast('خطا در بازگردانی متقاضی.', 'error');
    }
  };

  // Fixed: now awaits DB save and uses stage title in history
  const updateCandidateStage = async (id: string, newStageId: StageId, newStageTitle?: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (candidate) {
      const updatedCandidate = {
        ...candidate,
        stage: newStageId,
        stageEnteredAt: new Date().toISOString(),
      };
      const historyLabel = newStageTitle || newStageId;
      const candidateWithHistory = addHistoryEntry(updatedCandidate, `انتقال به مرحله «${historyLabel}»`);
      try {
        await dbService.saveCandidate(candidateWithHistory);
        setCandidatesState(prev => prev.map(c => c.id === id ? candidateWithHistory : c));
        addToast(`متقاضی به مرحله «${historyLabel}» منتقل شد.`, 'success');
      } catch {
        addToast('خطا در تغییر مرحله.', 'error');
      }
    }
  };

  // Fixed: now awaits DB save
  const unarchiveCandidate = async (id: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (candidate) {
      const updated = { ...candidate, stage: 'inbox' as StageId, stageEnteredAt: new Date().toISOString() };
      const candidateWithHistory = addHistoryEntry(updated, 'از آرشیو خارج شد و به صندوق ورودی منتقل شد');
      try {
        await dbService.saveCandidate(candidateWithHistory);
        setCandidatesState(prev => prev.map(c => c.id === id ? candidateWithHistory : c));
        addToast('متقاضی از آرشیو خارج شد.', 'success');
      } catch {
        addToast('خطا در خروج از آرشیو.', 'error');
      }
    }
  };

  // Fixed: now awaits DB save
  const addComment = async (id: string, comment: Comment) => {
    const candidate = candidates.find(c => c.id === id);
    if (candidate) {
      const updated = { ...candidate, comments: [...candidate.comments, comment] };
      try {
        await dbService.saveCandidate(updated);
        setCandidatesState(prev => prev.map(c => c.id === id ? updated : c));
        addToast('یادداشت اضافه شد.', 'success');
      } catch {
        addToast('خطا در ذخیره یادداشت.', 'error');
      }
    }
  };

  const addCustomHistoryEntry = (id: string, actionText: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (candidate && user && actionText.trim()) {
      const candidateWithHistory = addHistoryEntry(candidate, actionText.trim());
      dbService.saveCandidate(candidateWithHistory);
      setCandidatesState(prev => prev.map(c => c.id === id ? candidateWithHistory : c));
      addToast('رویداد جدید در تاریخچه ثبت شد.', 'success');
    }
  };

  const updateTestResult = async (candidateId: string, testId: string, resultData: Partial<TestResult>) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    const existingResults = candidate.testResults || [];
    let resultExists = false;

    const updatedResults = existingResults.map(r => {
      if (r.testId === testId) {
        resultExists = true;
        return { ...r, ...resultData };
      }
      return r;
    });

    if (!resultExists) {
      updatedResults.push({ testId, status: 'not_sent', ...resultData });
    }

    const action = `نتیجه آزمون به‌روزرسانی شد`;
    const updatedCandidate = addHistoryEntry({ ...candidate, testResults: updatedResults }, action);
    await updateCandidate(updatedCandidate);
  };

  const updateScorecard = async (candidateId: string, entry: ScorecardEntry) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    const existing = candidate.scorecards || [];
    const existingIndex = existing.findIndex(s => s.stageId === entry.stageId);
    const updatedScorecards = existingIndex >= 0
      ? existing.map((s, i) => i === existingIndex ? entry : s)
      : [...existing, entry];

    const updatedCandidate = addHistoryEntry(
      { ...candidate, scorecards: updatedScorecards },
      `کارت امتیازدهی مرحله ثبت شد`
    );
    await updateCandidate(updatedCandidate);
  };

  const value = {
    candidates, setCandidates,
    addCandidate, updateCandidate, deleteCandidate,
    updateCandidateStage, unarchiveCandidate,
    addComment, addCustomHistoryEntry,
    updateTestResult, updateScorecard,
    lastDeleted, undoDelete,
  };

  return <CandidatesContext.Provider value={value}>{children}</CandidatesContext.Provider>;
};
