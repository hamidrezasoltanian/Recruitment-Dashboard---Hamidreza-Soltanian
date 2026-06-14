import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Candidate, StageId, Comment, TestResult } from '../types';
import { apiService } from '../services/apiService';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

interface CandidatesContextType {
  candidates: Candidate[];
  isLoading: boolean;
  addCandidate: (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>, resumeFile?: File) => Promise<void>;
  updateCandidate: (candidate: Candidate, resumeFile?: File) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  updateCandidateStage: (id: string, newStage: StageId) => Promise<void>;
  unarchiveCandidate: (id: string) => Promise<void>;
  addComment: (id: string, comment: Comment) => Promise<void>;
  addCustomHistoryEntry: (id: string, actionText: string) => Promise<void>;
  updateTestResult: (candidateId: string, testId: string, resultData: Partial<TestResult>) => Promise<void>;
  refreshCandidates: () => Promise<void>;
}

const CandidatesContext = createContext<CandidatesContextType | undefined>(undefined);

export const useCandidates = () => {
  const context = useContext(CandidatesContext);
  if (!context) throw new Error('useCandidates must be used within a CandidatesProvider');
  return context;
};

export const CandidatesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const { user } = useAuth();

  const refreshCandidates = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await apiService.getCandidates();
      setCandidates(data);
    } catch (error: any) {
      addToast(error.message || 'خطا در بارگذاری متقاضیان', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    refreshCandidates();
  }, [refreshCandidates]);

  const addCandidate = async (candidate: any, resumeFile?: File) => {
    try {
      const created = await apiService.createCandidate(candidate);
      if (resumeFile) await apiService.uploadResume(created.id, resumeFile);
      await refreshCandidates();
      addToast('متقاضی با موفقیت اضافه شد.', 'success');
    } catch (error: any) {
      addToast(error.message || 'خطا در افزودن متقاضی.', 'error');
    }
  };

  const updateCandidate = async (candidate: Candidate, resumeFile?: File) => {
    try {
      await apiService.updateCandidate(candidate.id, candidate);
      if (resumeFile) await apiService.uploadResume(candidate.id, resumeFile);
      await refreshCandidates();
      addToast('اطلاعات با موفقیت به‌روزرسانی شد.', 'success');
    } catch (error: any) {
      addToast(error.message || 'خطا در به‌روزرسانی.', 'error');
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      await apiService.deleteCandidate(id);
      setCandidates(prev => prev.filter(c => c.id !== id));
      addToast('متقاضی حذف شد.', 'success');
    } catch (error: any) {
      addToast(error.message || 'خطا در حذف متقاضی.', 'error');
    }
  };

  const updateCandidateStage = async (id: string, newStage: StageId) => {
    try {
      const updated = await apiService.updateCandidateStage(id, newStage);
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      addToast(`مرحله به ${newStage} تغییر کرد.`, 'success');
    } catch (error: any) {
      addToast(error.message || 'خطا در تغییر مرحله.', 'error');
    }
  };

  const unarchiveCandidate = async (id: string) => {
    await updateCandidateStage(id, 'inbox' as StageId);
    addToast('متقاضی از آرشیو خارج شد.', 'success');
  };

  const addComment = async (id: string, comment: Comment) => {
    try {
      await apiService.addComment(id, comment.text);
      await refreshCandidates();
      addToast('یادداشت اضافه شد.', 'success');
    } catch (error: any) {
      addToast(error.message || 'خطا در افزودن یادداشت.', 'error');
    }
  };

  const addCustomHistoryEntry = async (id: string, actionText: string) => {
    try {
      await apiService.addHistoryEntry(id, actionText);
      await refreshCandidates();
      addToast('رویداد جدید در تاریخچه ثبت شد.', 'success');
    } catch (error: any) {
      addToast(error.message || 'خطا در ثبت تاریخچه.', 'error');
    }
  };

  const updateTestResult = async (candidateId: string, testId: string, resultData: Partial<TestResult>) => {
    try {
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) return;
      const updatedResults = [...(candidate.testResults || [])];
      const idx = updatedResults.findIndex(r => r.testId === testId);
      if (idx >= 0) {
        updatedResults[idx] = { ...updatedResults[idx], ...resultData };
      } else {
        updatedResults.push({ testId, status: 'not_sent', ...resultData } as TestResult);
      }
      await apiService.updateCandidate(candidateId, { ...candidate, testResults: updatedResults });
      await refreshCandidates();
    } catch (error: any) {
      addToast(error.message || 'خطا در به‌روزرسانی آزمون.', 'error');
    }
  };

  const value = {
    candidates,
    isLoading,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    updateCandidateStage,
    unarchiveCandidate,
    addComment,
    addCustomHistoryEntry,
    updateTestResult,
    refreshCandidates,
  };

  return <CandidatesContext.Provider value={value}>{children}</CandidatesContext.Provider>;
};
