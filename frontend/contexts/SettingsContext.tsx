import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DEFAULT_SOURCES, DEFAULT_COMPANY_PROFILE, DEFAULT_STAGES, DEFAULT_TEST_LIBRARY } from '../constants';
import { CompanyProfile, JobPosition, KanbanStage, TestLibraryItem } from '../types';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface FullSettings {
    sources: string[];
    stages: KanbanStage[];
    companyProfile: CompanyProfile;
    testLibrary: TestLibraryItem[];
}

interface SettingsContextType extends FullSettings {
  isLoading: boolean;
  addSource: (source: string) => Promise<void>;
  deleteSource: (source: string) => Promise<void>;
  addStage: (title: string) => Promise<void>;
  updateStage: (id: string, title: string) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;
  updateCompanyDetails: (details: Partial<Omit<CompanyProfile, 'jobPositions'>>) => Promise<void>;
  addJobPosition: (title: string) => Promise<void>;
  updateJobPosition: (id: string, title: string) => Promise<void>;
  deleteJobPosition: (id: string) => Promise<void>;
  addTest: (test: Omit<TestLibraryItem, 'id'>) => Promise<void>;
  updateTest: (test: TestLibraryItem) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<FullSettings>({
      sources: DEFAULT_SOURCES,
      stages: DEFAULT_STAGES,
      companyProfile: DEFAULT_COMPANY_PROFILE,
      testLibrary: DEFAULT_TEST_LIBRARY
  });
  
  const fetchSettings = useCallback(async () => {
      try {
          setIsLoading(true);
          const serverSettings = await api.get<FullSettings>('/settings');
          setSettings(serverSettings);
      } catch (error: any) {
          addToast(`خطا در بارگذاری تنظیمات: ${error.message}`, 'error');
      } finally {
          setIsLoading(false);
      }
  }, [addToast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated, fetchSettings]);

  const updateAndRefetch = async (newSettings: Partial<FullSettings>) => {
      try {
          const payload = { ...settings, ...newSettings };
          await api.put<FullSettings>('/settings', payload);
          await fetchSettings(); // Refetch to ensure state is synchronized with backend
          return true;
      } catch (error: any) {
          addToast(`خطا در ذخیره تنظیمات: ${error.message}`, 'error');
          return false;
      }
  };

  const addSource = async (source: string) => {
    const trimmedSource = source.trim();
    if (trimmedSource && !settings.sources.find(s => s.toLowerCase() === trimmedSource.toLowerCase())) {
        if (await updateAndRefetch({ sources: [...settings.sources, trimmedSource] })) {
            addToast(`منبع "${trimmedSource}" اضافه شد.`, 'success');
        }
    } else {
      addToast('منبع تکراری یا خالی است.', 'error');
    }
  };

  const deleteSource = async (sourceToDelete: string) => {
    if (await updateAndRefetch({ sources: settings.sources.filter(s => s !== sourceToDelete) })) {
        addToast(`منبع "${sourceToDelete}" حذف شد.`, 'success');
    }
  };

  const addStage = async (title: string) => {
    const trimmedTitle = title.trim();
    if (trimmedTitle && !settings.stages.find(s => s.title.toLowerCase() === trimmedTitle.toLowerCase())) {
        const newStage: KanbanStage = { id: `stage_${Date.now()}`, title: trimmedTitle, isCore: false };
        if (await updateAndRefetch({ stages: [...settings.stages, newStage] })) {
            addToast(`مرحله "${trimmedTitle}" اضافه شد.`, 'success');
        }
    } else {
        addToast('عنوان مرحله تکراری یا خالی است.', 'error');
    }
  };

  const updateStage = async (id: string, title: string) => {
    const newStages = settings.stages.map(s => s.id === id ? { ...s, title } : s);
    if (await updateAndRefetch({ stages: newStages })) {
        addToast('مرحله به‌روزرسانی شد.', 'success');
    }
  };

  const deleteStage = async (id: string) => {
      const stageToDelete = settings.stages.find(s => s.id === id);
      if (!stageToDelete || stageToDelete.isCore) {
        addToast('نمی‌توان مراحل اصلی را حذف کرد.', 'error');
        return;
      }
      if (await updateAndRefetch({ stages: settings.stages.filter(s => s.id !== id) })) {
          addToast(`مرحله "${stageToDelete.title}" حذف شد.`, 'success');
      }
  };

  const updateCompanyDetails = async (details: Partial<Omit<CompanyProfile, 'jobPositions'>>) => {
      const newProfile = { ...settings.companyProfile, ...details };
      if (await updateAndRefetch({ companyProfile: newProfile })) {
          addToast('اطلاعات شرکت به‌روزرسانی شد.', 'success');
      }
  };

  const addJobPosition = async (title: string) => {
    const trimmedTitle = title.trim();
    if (trimmedTitle && !settings.companyProfile.jobPositions.find(j => j.title.toLowerCase() === trimmedTitle.toLowerCase())) {
      const newJob: JobPosition = { id: `job_${Date.now()}`, title: trimmedTitle };
      const newJobs = [...settings.companyProfile.jobPositions, newJob];
      const newProfile = { ...settings.companyProfile, jobPositions: newJobs };
      if (await updateAndRefetch({ companyProfile: newProfile })) {
          addToast(`موقعیت شغلی "${trimmedTitle}" اضافه شد.`, 'success');
      }
    } else {
      addToast('موقعیت شغلی تکراری یا خالی است.', 'error');
    }
  };

  const updateJobPosition = async (id: string, title: string) => {
    const newJobs = settings.companyProfile.jobPositions.map(j => j.id === id ? { ...j, title } : j);
    const newProfile = { ...settings.companyProfile, jobPositions: newJobs };
    if (await updateAndRefetch({ companyProfile: newProfile })) {
        addToast('موقعیت شغلی به‌روزرسانی شد.', 'success');
    }
  };

  const deleteJobPosition = async (id: string) => {
    const newJobs = settings.companyProfile.jobPositions.filter(j => j.id !== id);
    const newProfile = { ...settings.companyProfile, jobPositions: newJobs };
    if (await updateAndRefetch({ companyProfile: newProfile })) {
        addToast('موقعیت شغلی حذف شد.', 'success');
    }
  };
  
  const addTest = async (test: Omit<TestLibraryItem, 'id'>) => {
    const newTest = { ...test, id: `test_${Date.now()}` };
    if (await updateAndRefetch({ testLibrary: [...settings.testLibrary, newTest] })) {
        addToast(`آزمون "${test.name}" اضافه شد.`, 'success');
    }
  };

  const updateTest = async (updatedTest: TestLibraryItem) => {
    const newLibrary = settings.testLibrary.map(t => t.id === updatedTest.id ? updatedTest : t);
    if (await updateAndRefetch({ testLibrary: newLibrary })) {
        addToast(`آزمون "${updatedTest.name}" به‌روزرسانی شد.`, 'success');
    }
  };

  const deleteTest = async (id: string) => {
    if (await updateAndRefetch({ testLibrary: settings.testLibrary.filter(t => t.id !== id) })) {
        addToast("آزمون حذف شد.", 'success');
    }
  };

  const value = { 
    ...settings, 
    isLoading, 
    addSource, 
    deleteSource, 
    addStage, 
    updateStage, 
    deleteStage, 
    updateCompanyDetails, 
    addJobPosition, 
    updateJobPosition, 
    deleteJobPosition, 
    addTest, 
    updateTest, 
    deleteTest 
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
