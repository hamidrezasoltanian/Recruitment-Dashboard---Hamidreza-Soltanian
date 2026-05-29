import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Candidate, StageId, Comment, HistoryEntry, TestResult, ScorecardEntry } from '../types';
import { dbService } from '../services/dbService';
import { supabaseService, isSupabaseEnabled } from '../services/supabaseService';
import { localApiCandidates, localApiFiles, isLocalServerMode } from '../services/localApiService';
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
  if (!context) throw new Error('useCandidates must be used within a CandidatesProvider');
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
  history: [{ user: 'سیستم', action: 'متقاضی پیش‌فرض ایجاد شد', timestamp: new Date().toISOString() }],
  comments: [{ id: '1', user: 'Admin', text: 'کاندیدای بسیار قوی، حتما مصاحبه شود.', timestamp: new Date().toISOString() }],
  hasResume: true,
  testResults: [
    { testId: 'test-1', status: 'passed', score: 95, notes: 'تحلیل روانشناسی مثبت بود', file: { name: 'archetype_result.pdf', type: 'application/pdf' } },
    { testId: 'test-2', status: 'pending', sentDate: new Date().toISOString() },
  ],
};

// ── storage helpers: files always go through IndexedDB (Phase 2: move to Supabase Storage) ──

const saveFile = async (key: string, file: File, type: 'resume' | 'test') => {
  if (type === 'resume') return dbService.saveResume(key, file);
  return dbService.saveTestFile(key, file);
};

export const CandidatesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [candidates, setCandidatesState] = useState<Candidate[]>([]);
  const [lastDeleted, setLastDeleted] = useState<Candidate | null>(null);
  const { addToast } = useToast();
  const { user, companyId } = useAuth();

  // ── Initial load ───────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return; // wait for auth

    const loadData = async () => {
      try {
        let data: Candidate[];
        if (isLocalServerMode()) {
          data = await localApiCandidates.getAll();
        } else if (isSupabaseEnabled && companyId) {
          data = await supabaseService.getAllCandidates();
        } else {
          data = await dbService.getAllCandidates();
        }

        if (data.length === 0 && !isLocalServerMode()) {
          // Seed default candidate (only in local/supabase modes)
          if (isSupabaseEnabled && companyId) {
            await supabaseService.saveCandidate(defaultCandidate);
          } else {
            await dbService.saveCandidate(defaultCandidate);
          }
          setCandidatesState([defaultCandidate]);
          addToast('متقاضی پیش‌فرض برای تست اضافه شد.', 'success');
        } else {
          setCandidatesState(data);
        }
      } catch (error) {
        console.error('Failed to load candidates', error);
        addToast('خطا در بارگذاری داده‌های متقاضیان.', 'error');
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, companyId]);

  // ── History helper ─────────────────────────────────────────────────

  const addHistoryEntry = useCallback((candidate: Candidate, action: string, details?: string): Candidate => {
    if (!user) return candidate;
    const entry: HistoryEntry = { user: user.name, action, details, timestamp: new Date().toISOString() };
    return { ...candidate, history: [entry, ...candidate.history] };
  }, [user]);

  // ── Storage helpers ────────────────────────────────────────────────

  const persist = async (candidate: Candidate) => {
    if (isLocalServerMode()) {
      await localApiCandidates.save(candidate);
    } else if (isSupabaseEnabled && companyId) {
      await supabaseService.saveCandidate(candidate);
    } else {
      await dbService.saveCandidate(candidate);
    }
  };

  const remove = async (id: string) => {
    if (isLocalServerMode()) {
      await localApiCandidates.delete(id);
    } else if (isSupabaseEnabled) {
      await supabaseService.deleteCandidate(id);
    } else {
      await dbService.deleteCandidate(id);
    }
  };

  // ── Public API ─────────────────────────────────────────────────────

  const setCandidates = async (newCandidates: Candidate[], suppressToast = false) => {
    try {
      if (isLocalServerMode()) {
        await localApiCandidates.deleteAll();
        await localApiCandidates.bulkSave(newCandidates);
      } else if (isSupabaseEnabled && companyId) {
        await supabaseService.clearAllCandidates();
        for (const c of newCandidates) await supabaseService.saveCandidate(c);
      } else {
        await dbService.clearAllCandidates();
        for (const c of newCandidates) await dbService.saveCandidate(c);
      }
      setCandidatesState(newCandidates);
      if (!suppressToast) addToast('لیست متقاضیان با موفقیت بازیابی شد.', 'success');
    } catch {
      addToast('خطا در ذخیره سازی داده‌های متقاضیان.', 'error');
    }
  };

  const addCandidate = async (candidate: Candidate, resumeFile?: File) => {
    // Duplicate detection by email or phone
    const emailDup = candidates.find(c => c.email && c.email.toLowerCase() === candidate.email?.toLowerCase());
    const phoneDup = candidates.find(c => c.phone && c.phone.replace(/\D/g, '') === candidate.phone?.replace(/\D/g, '') && candidate.phone?.replace(/\D/g, '') !== '');
    if (emailDup) {
      addToast(`متقاضی با این ایمیل قبلاً ثبت شده: «${emailDup.name}»`, 'error');
      return;
    }
    if (phoneDup) {
      addToast(`متقاضی با این شماره تلفن قبلاً ثبت شده: «${phoneDup.name}»`, 'error');
      return;
    }

    const withHistory = addHistoryEntry(candidate, 'متقاضی ایجاد شد');
    const newCandidate: Candidate = { ...withHistory, testResults: [], stageEnteredAt: new Date().toISOString() };
    try {
      await persist(newCandidate);
      if (resumeFile) {
        if (isLocalServerMode()) await localApiFiles.uploadResume(candidate.id, resumeFile);
        else await saveFile(candidate.id, resumeFile, 'resume');
      }
      setCandidatesState(prev => [...prev, newCandidate]);
      addToast('متقاضی با موفقیت اضافه شد.', 'success');
    } catch {
      addToast('خطا در افزودن متقاضی.', 'error');
    }
  };

  const updateCandidate = async (candidate: Candidate, resumeFile?: File) => {
    const withHistory = addHistoryEntry(candidate, 'اطلاعات ویرایش شد');
    try {
      await persist(withHistory);
      if (resumeFile) {
        if (isLocalServerMode()) await localApiFiles.uploadResume(candidate.id, resumeFile);
        else await saveFile(candidate.id, resumeFile, 'resume');
      }
      setCandidatesState(prev => prev.map(c => c.id === candidate.id ? withHistory : c));
      addToast('اطلاعات با موفقیت به‌روزرسانی شد.', 'success');
    } catch {
      addToast('خطا در به‌روزرسانی اطلاعات.', 'error');
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      const candidate = candidates.find(c => c.id === id);
      await remove(id);
      if (isLocalServerMode()) {
        await localApiFiles.deleteResume(id);
      } else {
        await dbService.deleteResume(id);
        if (candidate?.testResults) {
          for (const r of candidate.testResults) {
            if (r.file) await dbService.deleteTestFile(`${id}_${r.testId}`);
          }
        }
      }
      if (candidate) setLastDeleted(candidate);
      setCandidatesState(prev => prev.filter(c => c.id !== id));
      addToast('متقاضی حذف شد. می‌توانید بازگردانید.', 'success');
    } catch {
      addToast('خطا در حذف متقاضی.', 'error');
    }
  };

  const undoDelete = async () => {
    if (!lastDeleted) return;
    try {
      await persist(lastDeleted);
      setCandidatesState(prev => [...prev, lastDeleted]);
      setLastDeleted(null);
      addToast(`متقاضی "${lastDeleted.name}" بازگردانده شد.`, 'success');
    } catch {
      addToast('خطا در بازگردانی متقاضی.', 'error');
    }
  };

  const updateCandidateStage = async (id: string, newStageId: StageId, newStageTitle?: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;
    const label = newStageTitle || newStageId;
    const updated = addHistoryEntry(
      { ...candidate, stage: newStageId, stageEnteredAt: new Date().toISOString() },
      `انتقال به مرحله «${label}»`
    );
    try {
      await persist(updated);
      setCandidatesState(prev => prev.map(c => c.id === id ? updated : c));
      addToast(`متقاضی به مرحله «${label}» منتقل شد.`, 'success');
    } catch {
      addToast('خطا در تغییر مرحله.', 'error');
    }
  };

  const unarchiveCandidate = async (id: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;
    const updated = addHistoryEntry(
      { ...candidate, stage: 'inbox' as StageId, stageEnteredAt: new Date().toISOString() },
      'از آرشیو خارج شد و به صندوق ورودی منتقل شد'
    );
    try {
      await persist(updated);
      setCandidatesState(prev => prev.map(c => c.id === id ? updated : c));
      addToast('متقاضی از آرشیو خارج شد.', 'success');
    } catch {
      addToast('خطا در خروج از آرشیو.', 'error');
    }
  };

  const addComment = async (id: string, comment: Comment) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;
    const updated = { ...candidate, comments: [...candidate.comments, comment] };
    try {
      await persist(updated);
      setCandidatesState(prev => prev.map(c => c.id === id ? updated : c));
      addToast('یادداشت اضافه شد.', 'success');
    } catch {
      addToast('خطا در ذخیره یادداشت.', 'error');
    }
  };

  const addCustomHistoryEntry = (id: string, actionText: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate || !user || !actionText.trim()) return;
    const updated = addHistoryEntry(candidate, actionText.trim());
    persist(updated);
    setCandidatesState(prev => prev.map(c => c.id === id ? updated : c));
    addToast('رویداد جدید در تاریخچه ثبت شد.', 'success');
  };

  const updateTestResult = async (candidateId: string, testId: string, resultData: Partial<TestResult>) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    let resultExists = false;
    const updatedResults = (candidate.testResults || []).map(r => {
      if (r.testId === testId) { resultExists = true; return { ...r, ...resultData }; }
      return r;
    });
    if (!resultExists) updatedResults.push({ testId, status: 'not_sent', ...resultData });
    const updated = addHistoryEntry({ ...candidate, testResults: updatedResults }, 'نتیجه آزمون به‌روزرسانی شد');
    await updateCandidate(updated);
  };

  const updateScorecard = async (candidateId: string, entry: ScorecardEntry) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    const existing = candidate.scorecards || [];
    // Match by stageId + evaluatedBy to support multiple interviewers per stage
    const idx = existing.findIndex(s => s.stageId === entry.stageId && s.evaluatedBy === entry.evaluatedBy);
    const updatedScorecards = idx >= 0
      ? existing.map((s, i) => i === idx ? entry : s)
      : [...existing, entry];
    const updated = addHistoryEntry({ ...candidate, scorecards: updatedScorecards }, 'کارت امتیازدهی مرحله ثبت شد');
    await updateCandidate(updated);
  };

  const value: CandidatesContextType = {
    candidates, setCandidates,
    addCandidate, updateCandidate, deleteCandidate,
    updateCandidateStage, unarchiveCandidate,
    addComment, addCustomHistoryEntry,
    updateTestResult, updateScorecard,
    lastDeleted, undoDelete,
  };

  return <CandidatesContext.Provider value={value}>{children}</CandidatesContext.Provider>;
};
