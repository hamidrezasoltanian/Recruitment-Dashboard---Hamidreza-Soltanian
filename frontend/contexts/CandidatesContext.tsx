import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Candidate, StageId, Comment, HistoryEntry, TestResult } from '../types';
import { dbService } from '../services/dbService';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

interface CandidatesContextType {
  candidates: Candidate[];
  addCandidate: (candidate: Candidate, resumeFile?: File) => Promise<void>;
  updateCandidate: (candidate: Candidate, resumeFile?: File) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  updateCandidateStage: (id: string, newStage: StageId) => void;
  unarchiveCandidate: (id: string) => void;
  addComment: (id: string, comment: Comment) => void;
  addCustomHistoryEntry: (id: string, actionText: string) => void;
  updateTestResult: (candidateId: string, testId: string, resultData: Partial<TestResult>) => Promise<void>;
  generateCandidatePortalToken: (candidateId: string) => Promise<string | null>;
}

const CandidatesContext = createContext<CandidatesContextType | undefined>(undefined);

export const useCandidates = () => {
  const context = useContext(CandidatesContext);
  if (!context) {
    throw new Error('useCandidates must be used within a CandidatesProvider');
  }
  return context;
};

export const CandidatesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [candidates, setCandidatesState] = useState<Candidate[]>([]);
  const { addToast } = useToast();
  const { user } = useAuth();
  const { testLibrary } = useSettings();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dbService.getAllCandidates();
        setCandidatesState(data);
      } catch (error: any) {
        console.error("Failed to load candidates from API", error);
        addToast(`خطا در بارگذاری داده‌ها از سرور: ${error.message}`, 'error');
      }
    };
    if (user) { // Only load data if user is logged in
        loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addHistoryEntry = useCallback((candidate: Candidate, action: string, details?: string): Candidate => {
    const userForHistory = user ? user.name : 'متقاضی';
    const historyEntry: HistoryEntry = {
      user: userForHistory,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    return { ...candidate, history: [historyEntry, ...(candidate.history || [])] };
  }, [user]);

  const addCandidate = async (candidate: Candidate, resumeFile?: File) => {
    const candidateWithHistory = addHistoryEntry(candidate, 'متقاضی ایجاد شد');
    const candidateWithTests = { ...candidateWithHistory, testResults: [] };
    try {
      const newCandidate = await dbService.createCandidate(candidateWithTests);
      if(resumeFile) await dbService.saveResume(candidate.id, resumeFile);
      setCandidatesState(prev => [...prev, newCandidate]);
      addToast('متقاضی با موفقیت اضافه شد.', 'success');
    } catch (error: any) {
      addToast(`خطا در افزودن متقاضی: ${error.message}`, 'error');
    }
  };

  const updateCandidate = async (candidate: Candidate, resumeFile?: File) => {
    try {
      const updatedCandidate = await dbService.updateCandidate(candidate);
      if(resumeFile) await dbService.saveResume(candidate.id, resumeFile);
      setCandidatesState(prev => prev.map(c => c.id === candidate.id ? updatedCandidate : c));
      // No toast here, as this function is called by many others that show their own toasts.
    } catch (error: any) {
      addToast(`خطا در به‌روزرسانی اطلاعات: ${error.message}`, 'error');
      throw error; // re-throw to be caught by caller if needed
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      await dbService.deleteCandidate(id);
      // await dbService.deleteResume(id); // File handling not implemented in backend
      setCandidatesState(prev => prev.filter(c => c.id !== id));
      addToast('متقاضی حذف شد.', 'success');
    } catch (error: any) {
      addToast(`خطا در حذف متقاضی: ${error.message}`, 'error');
    }
  };

  const updateCandidateStage = async (id: string, newStage: StageId) => {
    const candidate = candidates.find(c => c.id === id);
    if (candidate) {
        const stageTitle = useSettings().stages.find(s => s.id === newStage)?.title || newStage;
        const updatedCandidate = { ...candidate, stage: newStage };
        const candidateWithHistory = addHistoryEntry(updatedCandidate, `مرحله به "${stageTitle}" تغییر کرد`);
        try {
            await updateCandidate(candidateWithHistory);
            addToast(`مرحله به ${stageTitle} تغییر کرد.`, 'success');
        } catch(e) {
            // Error is handled in updateCandidate
        }
    }
  };
  
  const unarchiveCandidate = async (id: string) => {
    const candidate = candidates.find(c => c.id === id);
    if(candidate) {
        const updatedCandidate = { ...candidate, stage: 'inbox' as StageId };
        const candidateWithHistory = addHistoryEntry(updatedCandidate, 'از آرشیو خارج شد و به صندوق ورودی منتقل شد');
        try {
            await updateCandidate(candidateWithHistory);
            addToast('متقاضی از آرشیو خارج شد.', 'success');
        } catch(e) {}
    }
  };

  const addComment = async (id: string, comment: Comment) => {
    const candidate = candidates.find(c => c.id === id);
    if (candidate) {
      const updatedCandidate = { ...candidate, comments: [...candidate.comments, comment] };
      try {
        await updateCandidate(updatedCandidate);
        addToast('یادداشت اضافه شد.', 'success');
      } catch(e) {}
    }
  };

  const addCustomHistoryEntry = async (id: string, actionText: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (candidate && user && actionText.trim()) {
      const candidateWithHistory = addHistoryEntry(candidate, actionText.trim());
      try {
          await updateCandidate(candidateWithHistory);
          addToast('رویداد جدید در تاریخچه ثبت شد.', 'success');
      } catch(e) {}
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
    
    const testName = testLibrary.find(t => t.id === testId)?.name || 'ناشناخته';
    const action = `نتیجه آزمون «${testName}» به‌روزرسانی شد`;
    
    const candidateWithHistory = addHistoryEntry({ ...candidate, testResults: updatedResults }, action);
    
    try {
        await updateCandidate(candidateWithHistory);
        addToast(action, 'success');
    } catch(e) {}
  };

  const generateCandidatePortalToken = async (candidateId: string): Promise<string | null> => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return null;

    if (candidate.portalToken) {
      return candidate.portalToken;
    }

    const newPortalToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const updatedCandidate = { ...candidate, portalToken: newPortalToken };
    
    const candidateWithHistory = addHistoryEntry(updatedCandidate, 'لینک پورتال متقاضی ایجاد شد');
    try {
        await updateCandidate(candidateWithHistory);
        addToast('لینک پورتال متقاضی با موفقیت ایجاد شد.', 'success');
        return newPortalToken;
    } catch (e) {
        addToast('خطا در ایجاد لینک پورتال.', 'error');
        return null;
    }
  };

  const value = { candidates, addCandidate, updateCandidate, deleteCandidate, updateCandidateStage, unarchiveCandidate, addComment, addCustomHistoryEntry, updateTestResult, generateCandidatePortalToken };

  return <CandidatesContext.Provider value={value}>{children}</CandidatesContext.Provider>;
};
