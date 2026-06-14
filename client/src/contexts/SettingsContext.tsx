import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { KanbanStage, CompanyProfile, TestLibraryItem, JobPosition } from '../types';
import { apiService } from '../services/apiService';
import { DEFAULT_STAGES, DEFAULT_COMPANY_PROFILE, DEFAULT_TEST_LIBRARY, DEFAULT_SOURCES } from '../constants';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  sources: string[];
  stages: KanbanStage[];
  companyProfile: CompanyProfile;
  testLibrary: TestLibraryItem[];
  updateSources: (sources: string[]) => Promise<void>;
  addSource: (name: string) => Promise<void>;
  deleteSource: (name: string) => Promise<void>;
  updateStages: (stages: KanbanStage[]) => void;
  setStageOrder: (stages: KanbanStage[]) => void;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => Promise<void>;
  updateCompanyDetails: (details: Partial<CompanyProfile>) => void;
  updateTestLibrary: (items: TestLibraryItem[]) => void;
  restoreSettings: (data: any) => void;
  addStage: (title: string) => void;
  updateStage: (id: string, title: string) => void;
  deleteStage: (id: string) => void;
  addJobPosition: (title: string) => void;
  updateJobPosition: (id: string, title: string) => void;
  deleteJobPosition: (id: string) => void;
  addTest: (test: Omit<TestLibraryItem, 'id'>) => void;
  updateTest: (test: TestLibraryItem) => void;
  deleteTest: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sources, setSources] = useState<string[]>(DEFAULT_SOURCES);
  const [stages, setStages] = useState<KanbanStage[]>(DEFAULT_STAGES);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [testLibrary, setTestLibrary] = useState<TestLibraryItem[]>(DEFAULT_TEST_LIBRARY);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Load settings from API
    apiService.getStages().then(data => {
      if (data && data.length > 0) setStages(data as any);
    }).catch(() => {});
    apiService.getSources().then(data => {
      if (data && data.length > 0) setSources(data.map((s: any) => s.name || s));
    }).catch(() => {});
    apiService.getCompanyProfile().then(data => {
      if (data) setCompanyProfile(data as any);
    }).catch(() => {});
    apiService.getTestLibrary().then(data => {
      if (data && data.length > 0) setTestLibrary(data as any);
    }).catch(() => {});
  }, [user]);

  const updateSources = async (newSources: string[]) => setSources(newSources);
  const addSource = async (name: string) => {
    try {
      await apiService.addSource(name);
      setSources(prev => [...prev, name]);
    } catch {}
  };
  const deleteSource = async (name: string) => setSources(prev => prev.filter(s => s !== name));
  const updateStages = (newStages: KanbanStage[]) => setStages(newStages);

  const setStageOrder = (newStages: KanbanStage[]) => {
    setStages(newStages);
    try {
      apiService.reorderStages(newStages.map((s, i) => ({ id: s.id, order: i })));
    } catch {}
  };

  const addStage = (title: string) => {
    const newStage: KanbanStage = { id: `stage_${Date.now()}`, title };
    try {
      apiService.createStage(newStage);
    } catch {}
    setStages(prev => [...prev, newStage]);
  };

  const updateStage = (id: string, title: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, title } : s));
    try {
      apiService.updateStage(id, { title });
    } catch {}
  };

  const deleteStage = (id: string) => {
    setStages(prev => prev.filter(s => s.id !== id));
    try {
      apiService.deleteStage(id);
    } catch {}
  };

  const updateCompanyProfile = async (profile: Partial<CompanyProfile>) => {
    try {
      const updated = await apiService.updateCompanyProfile(profile);
      setCompanyProfile(prev => ({ ...prev, ...updated }));
    } catch {
      setCompanyProfile(prev => ({ ...prev, ...profile }));
    }
  };

  const updateCompanyDetails = (details: Partial<CompanyProfile>) => {
    setCompanyProfile(prev => ({ ...prev, ...details }));
    try {
      apiService.updateCompanyProfile(details);
    } catch {}
  };

  const addJobPosition = (title: string) => {
    const newJob: JobPosition = { id: `job_${Date.now()}`, title };
    setCompanyProfile(prev => ({ ...prev, jobPositions: [...(prev.jobPositions || []), newJob] }));
  };

  const updateJobPosition = (id: string, title: string) => {
    setCompanyProfile(prev => ({
      ...prev,
      jobPositions: (prev.jobPositions || []).map(j => j.id === id ? { ...j, title } : j),
    }));
  };

  const deleteJobPosition = (id: string) => {
    setCompanyProfile(prev => ({
      ...prev,
      jobPositions: (prev.jobPositions || []).filter(j => j.id !== id),
    }));
  };

  const updateTestLibrary = (items: TestLibraryItem[]) => setTestLibrary(items);

  const addTest = (test: Omit<TestLibraryItem, 'id'>) => {
    const newItem: TestLibraryItem = { id: `test_${Date.now()}`, ...test };
    setTestLibrary(prev => [...prev, newItem]);
    try {
      apiService.addTestLibraryItem(test);
    } catch {}
  };

  const updateTest = (test: TestLibraryItem) => {
    setTestLibrary(prev => prev.map(t => t.id === test.id ? test : t));
    try {
      apiService.updateTestLibraryItem(test.id, test);
    } catch {}
  };

  const deleteTest = (id: string) => {
    setTestLibrary(prev => prev.filter(t => t.id !== id));
    try {
      apiService.deleteTestLibraryItem(id);
    } catch {}
  };

  const restoreSettings = (data: any) => {
    if (data.sources) setSources(data.sources);
    if (data.stages) setStages(data.stages);
    if (data.companyProfile) setCompanyProfile(data.companyProfile);
    if (data.testLibrary) setTestLibrary(data.testLibrary);
  };

  const value = {
    sources, stages, companyProfile, testLibrary,
    updateSources, addSource, deleteSource,
    updateStages, setStageOrder,
    addStage, updateStage, deleteStage,
    updateCompanyProfile, updateCompanyDetails,
    addJobPosition, updateJobPosition, deleteJobPosition,
    updateTestLibrary, addTest, updateTest, deleteTest,
    restoreSettings,
  };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
