import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEFAULT_SOURCES, SETTINGS_KEY_SOURCES, COMPANY_PROFILE_KEY, DEFAULT_COMPANY_PROFILE, STAGES_KEY, DEFAULT_STAGES, TEST_LIBRARY_KEY, DEFAULT_TEST_LIBRARY, SLA_SETTINGS_KEY, SCORECARD_TEMPLATES_KEY } from '../constants';
import { CompanyProfile, KanbanStage, ScorecardCriteria, TestLibraryItem } from '../types';
import { useToast } from './ToastContext';
import { generateId } from '../utils/idUtils';

interface SettingsContextType {
  sources: string[];
  addSource: (source: string) => void;
  deleteSource: (source: string) => void;
  stages: KanbanStage[];
  setStageOrder: (orderedStages: KanbanStage[]) => void;
  addStage: (title: string) => void;
  updateStage: (id: string, title: string) => void;
  deleteStage: (id: string) => void;
  companyProfile: CompanyProfile;
  updateCompanyDetails: (details: Partial<Omit<CompanyProfile, 'jobPositions'>>) => void;
  addJobPosition: (title: string) => void;
  updateJobPosition: (id: string, title: string) => void;
  deleteJobPosition: (id: string) => void;
  testLibrary: TestLibraryItem[];
  addTest: (test: Omit<TestLibraryItem, 'id'>) => void;
  updateTest: (test: TestLibraryItem) => void;
  deleteTest: (id: string) => void;
  // SLA
  slaSettings: Record<string, number>;
  updateStageSLA: (stageId: string, days: number) => void;
  // Scorecard templates
  scorecardTemplates: Record<string, ScorecardCriteria[]>;
  addScorecardCriteria: (stageId: string, name: string, weight: number) => void;
  updateScorecardCriteria: (stageId: string, criteria: ScorecardCriteria) => void;
  deleteScorecardCriteria: (stageId: string, criteriaId: string) => void;
  restoreSettings: (settings: { sources: string[]; stages: KanbanStage[]; companyProfile: CompanyProfile; testLibrary: TestLibraryItem[]; slaSettings?: Record<string, number>; scorecardTemplates?: Record<string, ScorecardCriteria[]> }) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  const [sources, setSources] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY_SOURCES);
      return stored ? JSON.parse(stored) : DEFAULT_SOURCES;
    } catch { return DEFAULT_SOURCES; }
  });

  const [stages, setStages] = useState<KanbanStage[]>(() => {
    try {
      const stored = localStorage.getItem(STAGES_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_STAGES;
    } catch { return DEFAULT_STAGES; }
  });

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const stored = localStorage.getItem(COMPANY_PROFILE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_COMPANY_PROFILE;
    } catch { return DEFAULT_COMPANY_PROFILE; }
  });

  const [testLibrary, setTestLibrary] = useState<TestLibraryItem[]>(() => {
    try {
      const stored = localStorage.getItem(TEST_LIBRARY_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_TEST_LIBRARY;
    } catch { return DEFAULT_TEST_LIBRARY; }
  });

  const [slaSettings, setSlaSettings] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(SLA_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const [scorecardTemplates, setScorecardTemplates] = useState<Record<string, ScorecardCriteria[]>>(() => {
    try {
      const stored = localStorage.getItem(SCORECARD_TEMPLATES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem(SETTINGS_KEY_SOURCES, JSON.stringify(sources)); }, [sources]);
  useEffect(() => { localStorage.setItem(STAGES_KEY, JSON.stringify(stages)); }, [stages]);
  useEffect(() => { localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(companyProfile)); }, [companyProfile]);
  useEffect(() => { localStorage.setItem(TEST_LIBRARY_KEY, JSON.stringify(testLibrary)); }, [testLibrary]);
  useEffect(() => { localStorage.setItem(SLA_SETTINGS_KEY, JSON.stringify(slaSettings)); }, [slaSettings]);
  useEffect(() => { localStorage.setItem(SCORECARD_TEMPLATES_KEY, JSON.stringify(scorecardTemplates)); }, [scorecardTemplates]);

  const addSource = (source: string) => {
    const trimmed = source.trim();
    if (trimmed && !sources.find(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSources(prev => [...prev, trimmed]);
      addToast(`منبع "${trimmed}" اضافه شد.`, 'success');
    } else {
      addToast('منبع تکراری یا خالی است.', 'error');
    }
  };

  const deleteSource = (sourceToDelete: string) => {
    setSources(prev => prev.filter(s => s !== sourceToDelete));
    addToast(`منبع "${sourceToDelete}" حذف شد.`, 'success');
  };

  const setStageOrder = (orderedStages: KanbanStage[]) => {
    setStages(orderedStages);
    addToast('ترتیب مراحل ذخیره شد.', 'success');
  };

  const addStage = (title: string) => {
    const trimmed = title.trim();
    if (trimmed && !stages.find(s => s.title.toLowerCase() === trimmed.toLowerCase())) {
      setStages(prev => [...prev, { id: `stage_${Date.now()}`, title: trimmed, isCore: false }]);
      addToast(`مرحله "${trimmed}" اضافه شد.`, 'success');
    } else {
      addToast('عنوان مرحله تکراری یا خالی است.', 'error');
    }
  };

  const updateStage = (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) { addToast('عنوان مرحله نمی‌تواند خالی باشد.', 'error'); return; }
    setStages(prev => prev.map(s => s.id === id ? { ...s, title: trimmed } : s));
    addToast('مرحله به‌روزرسانی شد.', 'success');
  };

  const deleteStage = (id: string) => {
    const stage = stages.find(s => s.id === id);
    if (!stage) return;
    if (stage.isCore) { addToast('نمی‌توان مراحل اصلی سیستم را حذف کرد.', 'error'); return; }
    setStages(prev => prev.filter(s => s.id !== id));
    addToast(`مرحله "${stage.title}" حذف شد.`, 'success');
  };

  const updateCompanyDetails = (details: Partial<Omit<CompanyProfile, 'jobPositions'>>) => {
    setCompanyProfile(prev => ({ ...prev, ...details }));
    addToast('اطلاعات شرکت به‌روزرسانی شد.', 'success');
  };

  const addJobPosition = (title: string) => {
    const trimmed = title.trim();
    if (trimmed && !companyProfile.jobPositions.find(j => j.title.toLowerCase() === trimmed.toLowerCase())) {
      setCompanyProfile(prev => ({ ...prev, jobPositions: [...prev.jobPositions, { id: `job_${Date.now()}`, title: trimmed }] }));
      addToast(`موقعیت شغلی "${trimmed}" اضافه شد.`, 'success');
    } else {
      addToast('موقعیت شغلی تکراری یا خالی است.', 'error');
    }
  };

  const updateJobPosition = (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) { addToast('عنوان نمی‌تواند خالی باشد.', 'error'); return; }
    setCompanyProfile(prev => ({ ...prev, jobPositions: prev.jobPositions.map(j => j.id === id ? { ...j, title: trimmed } : j) }));
    addToast('موقعیت شغلی به‌روزرسانی شد.', 'success');
  };

  const deleteJobPosition = (id: string) => {
    setCompanyProfile(prev => ({ ...prev, jobPositions: prev.jobPositions.filter(j => j.id !== id) }));
    addToast('موقعیت شغلی حذف شد.', 'success');
  };

  const addTest = (test: Omit<TestLibraryItem, 'id'>) => {
    if (!test.name.trim() || !test.url.trim()) { addToast('نام و لینک آزمون نمی‌تواند خالی باشد.', 'error'); return; }
    setTestLibrary(prev => [...prev, { ...test, id: `test_${Date.now()}` }]);
    addToast(`آزمون "${test.name}" اضافه شد.`, 'success');
  };

  const updateTest = (updatedTest: TestLibraryItem) => {
    if (!updatedTest.name.trim() || !updatedTest.url.trim()) { addToast('نام و لینک آزمون نمی‌تواند خالی باشد.', 'error'); return; }
    setTestLibrary(prev => prev.map(t => t.id === updatedTest.id ? updatedTest : t));
    addToast(`آزمون "${updatedTest.name}" به‌روزرسانی شد.`, 'success');
  };

  const deleteTest = (id: string) => {
    setTestLibrary(prev => prev.filter(t => t.id !== id));
    addToast('آزمون حذف شد.', 'success');
  };

  // SLA
  const updateStageSLA = (stageId: string, days: number) => {
    setSlaSettings(prev => ({ ...prev, [stageId]: days }));
    addToast('SLA مرحله ذخیره شد.', 'success');
  };

  // Scorecard
  const addScorecardCriteria = (stageId: string, name: string, weight: number) => {
    const trimmed = name.trim();
    if (!trimmed) { addToast('نام معیار نمی‌تواند خالی باشد.', 'error'); return; }
    const newCriteria: ScorecardCriteria = { id: generateId('cr'), name: trimmed, weight };
    setScorecardTemplates(prev => ({
      ...prev,
      [stageId]: [...(prev[stageId] || []), newCriteria],
    }));
    addToast(`معیار "${trimmed}" اضافه شد.`, 'success');
  };

  const updateScorecardCriteria = (stageId: string, criteria: ScorecardCriteria) => {
    setScorecardTemplates(prev => ({
      ...prev,
      [stageId]: (prev[stageId] || []).map(c => c.id === criteria.id ? criteria : c),
    }));
    addToast('معیار به‌روزرسانی شد.', 'success');
  };

  const deleteScorecardCriteria = (stageId: string, criteriaId: string) => {
    setScorecardTemplates(prev => ({
      ...prev,
      [stageId]: (prev[stageId] || []).filter(c => c.id !== criteriaId),
    }));
    addToast('معیار حذف شد.', 'success');
  };

  const restoreSettings = (settings: { sources: string[]; stages: KanbanStage[]; companyProfile: CompanyProfile; testLibrary: TestLibraryItem[]; slaSettings?: Record<string, number>; scorecardTemplates?: Record<string, ScorecardCriteria[]> }) => {
    if (settings) {
      if (settings.sources) setSources(settings.sources);
      if (settings.stages) setStages(settings.stages);
      if (settings.companyProfile) setCompanyProfile(settings.companyProfile);
      if (settings.testLibrary) setTestLibrary(settings.testLibrary);
      if (settings.slaSettings) setSlaSettings(settings.slaSettings);
      if (settings.scorecardTemplates) setScorecardTemplates(settings.scorecardTemplates);
      addToast('تنظیمات برنامه بازیابی شد.', 'success');
    } else {
      addToast('داده‌های تنظیمات در فایل پشتیبان یافت نشد.', 'error');
    }
  };

  const value = {
    sources, addSource, deleteSource,
    stages, setStageOrder, addStage, updateStage, deleteStage,
    companyProfile, updateCompanyDetails, addJobPosition, updateJobPosition, deleteJobPosition,
    testLibrary, addTest, updateTest, deleteTest,
    slaSettings, updateStageSLA,
    scorecardTemplates, addScorecardCriteria, updateScorecardCriteria, deleteScorecardCriteria,
    restoreSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
