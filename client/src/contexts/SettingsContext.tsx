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
  // Keep source objects internally to have access to IDs for delete
  const [sourceObjects, setSourceObjects] = useState<{ id: string; name: string }[]>([]);
  const [stages, setStages] = useState<KanbanStage[]>(DEFAULT_STAGES);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [testLibrary, setTestLibrary] = useState<TestLibraryItem[]>(DEFAULT_TEST_LIBRARY);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    apiService.getStages().then(data => {
      if (data && data.length > 0) setStages(data as any);
    }).catch(() => {});
    apiService.getSources().then((data: any[]) => {
      if (data && data.length > 0) {
        setSourceObjects(data.map((s: any) => ({ id: String(s.id || s), name: String(s.name || s) })));
        setSources(data.map((s: any) => String(s.name || s)));
      }
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
      const created = await apiService.addSource(name);
      setSourceObjects(prev => [...prev, { id: created.id, name: created.name }]);
      setSources(prev => [...prev, name]);
    } catch {}
  };

  const deleteSource = async (name: string) => {
    const obj = sourceObjects.find(s => s.name === name);
    if (obj) {
      try { await apiService.deleteSource(obj.id); } catch {}
    }
    setSourceObjects(prev => prev.filter(s => s.name !== name));
    setSources(prev => prev.filter(s => s !== name));
  };

  const updateStages = (newStages: KanbanStage[]) => setStages(newStages);

  const setStageOrder = (newStages: KanbanStage[]) => {
    setStages(newStages);
    apiService.reorderStages(newStages.map((s, i) => ({ id: s.id, order: i }))).catch(() => {});
  };

  const addStage = async (title: string) => {
    try {
      const created = await apiService.createStage({ title, isCore: false } as any);
      setStages(prev => [...prev, created as any]);
    } catch {
      // fallback: local only
      setStages(prev => [...prev, { id: `stage_${Date.now()}`, title } as any]);
    }
  };

  const updateStage = async (id: string, title: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, title } : s));
    apiService.updateStage(id, { title }).catch(() => {});
  };

  const deleteStage = async (id: string) => {
    setStages(prev => prev.filter(s => s.id !== id));
    apiService.deleteStage(id).catch(() => {});
  };

  const updateCompanyProfile = async (profile: Partial<CompanyProfile>) => {
    try {
      const updated = await apiService.updateCompanyProfile(profile);
      setCompanyProfile(prev => ({ ...prev, ...updated }));
    } catch {
      setCompanyProfile(prev => ({ ...prev, ...profile }));
    }
  };

  const updateCompanyDetails = async (details: Partial<CompanyProfile>) => {
    setCompanyProfile(prev => ({ ...prev, ...details }));
    apiService.updateCompanyProfile(details).catch(() => {});
  };

  const addJobPosition = async (title: string) => {
    try {
      const created = await apiService.addJobPosition(title);
      setCompanyProfile(prev => ({
        ...prev,
        jobPositions: [...(prev.jobPositions || []), { id: created.id, title: created.title }]
      }));
    } catch {
      const newJob: JobPosition = { id: `job_${Date.now()}`, title };
      setCompanyProfile(prev => ({ ...prev, jobPositions: [...(prev.jobPositions || []), newJob] }));
    }
  };

  const updateJobPosition = async (id: string, title: string) => {
    setCompanyProfile(prev => ({
      ...prev,
      jobPositions: (prev.jobPositions || []).map(j => j.id === id ? { ...j, title } : j),
    }));
    apiService.updateJobPosition(id, title).catch(() => {});
  };

  const deleteJobPosition = async (id: string) => {
    setCompanyProfile(prev => ({
      ...prev,
      jobPositions: (prev.jobPositions || []).filter(j => j.id !== id),
    }));
    apiService.deleteJobPosition(id).catch(() => {});
  };

  const updateTestLibrary = (items: TestLibraryItem[]) => setTestLibrary(items);

  const addTest = async (test: Omit<TestLibraryItem, 'id'>) => {
    try {
      const created = await apiService.addTestLibraryItem(test);
      setTestLibrary(prev => [...prev, created as any]);
    } catch {
      setTestLibrary(prev => [...prev, { id: `test_${Date.now()}`, ...test }]);
    }
  };

  const updateTest = async (test: TestLibraryItem) => {
    setTestLibrary(prev => prev.map(t => t.id === test.id ? test : t));
    apiService.updateTestLibraryItem(test.id, test).catch(() => {});
  };

  const deleteTest = async (id: string) => {
    setTestLibrary(prev => prev.filter(t => t.id !== id));
    apiService.deleteTestLibraryItem(id).catch(() => {});
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
