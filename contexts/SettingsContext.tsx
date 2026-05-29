import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DEFAULT_SOURCES, SETTINGS_KEY_SOURCES, COMPANY_PROFILE_KEY, DEFAULT_COMPANY_PROFILE, STAGES_KEY, DEFAULT_STAGES, TEST_LIBRARY_KEY, DEFAULT_TEST_LIBRARY, SLA_SETTINGS_KEY, SCORECARD_TEMPLATES_KEY, KAVENEGAR_API_KEY } from '../constants';
import { CompanyProfile, KanbanStage, ScorecardCriteria, TestLibraryItem } from '../types';
import { useToast } from './ToastContext';
import { generateId } from '../utils/idUtils';
import { supabaseService, isSupabaseEnabled } from '../services/supabaseService';
import { useAuth } from './AuthContext';

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
  slaSettings: Record<string, number>;
  updateStageSLA: (stageId: string, days: number) => void;
  scorecardTemplates: Record<string, ScorecardCriteria[]>;
  addScorecardCriteria: (stageId: string, name: string, weight: number) => void;
  updateScorecardCriteria: (stageId: string, criteria: ScorecardCriteria) => void;
  deleteScorecardCriteria: (stageId: string, criteriaId: string) => void;
  kavenegarApiKey: string;
  setKavenegarApiKey: (key: string) => void;
  restoreSettings: (settings: {
    sources: string[];
    stages: KanbanStage[];
    companyProfile: CompanyProfile;
    testLibrary: TestLibraryItem[];
    slaSettings?: Record<string, number>;
    scorecardTemplates?: Record<string, ScorecardCriteria[]>;
  }) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

const fromLS = <T,>(key: string, fallback: T): T => {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { user, companyId } = useAuth();

  const [sources, setSources] = useState<string[]>(() => fromLS(SETTINGS_KEY_SOURCES, DEFAULT_SOURCES));
  const [stages, setStages] = useState<KanbanStage[]>(() => fromLS(STAGES_KEY, DEFAULT_STAGES));
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => fromLS(COMPANY_PROFILE_KEY, DEFAULT_COMPANY_PROFILE));
  const [testLibrary, setTestLibrary] = useState<TestLibraryItem[]>(() => fromLS(TEST_LIBRARY_KEY, DEFAULT_TEST_LIBRARY));
  const [slaSettings, setSlaSettings] = useState<Record<string, number>>(() => fromLS(SLA_SETTINGS_KEY, {}));
  const [scorecardTemplates, setScorecardTemplates] = useState<Record<string, ScorecardCriteria[]>>(() => fromLS(SCORECARD_TEMPLATES_KEY, {}));
  const [kavenegarApiKey, setKavenegarApiKeyState] = useState<string>(() => localStorage.getItem(KAVENEGAR_API_KEY) || '');

  // ── Load from Supabase when authenticated ────────────────────────────

  useEffect(() => {
    if (!isSupabaseEnabled || !user || !companyId) return;
    supabaseService.loadSettings().then(remote => {
      if (!remote) return;
      if (remote.sources?.length)        { setSources(remote.sources);           localStorage.setItem(SETTINGS_KEY_SOURCES, JSON.stringify(remote.sources)); }
      if (remote.stages?.length)         { setStages(remote.stages);             localStorage.setItem(STAGES_KEY, JSON.stringify(remote.stages)); }
      if (remote.companyProfile?.name)   { setCompanyProfile(remote.companyProfile); localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(remote.companyProfile)); }
      if (remote.testLibrary?.length)    { setTestLibrary(remote.testLibrary);   localStorage.setItem(TEST_LIBRARY_KEY, JSON.stringify(remote.testLibrary)); }
      if (remote.slaSettings)            { setSlaSettings(remote.slaSettings);   localStorage.setItem(SLA_SETTINGS_KEY, JSON.stringify(remote.slaSettings)); }
      if (remote.scorecardTemplates)     { setScorecardTemplates(remote.scorecardTemplates); localStorage.setItem(SCORECARD_TEMPLATES_KEY, JSON.stringify(remote.scorecardTemplates)); }
    }).catch(console.error);
  }, [user, companyId]);

  // ── Persist to localStorage + debounced Supabase save ───────────────

  const syncToSupabase = useCallback((partial: Parameters<typeof supabaseService.saveSettings>[0]) => {
    if (isSupabaseEnabled && companyId) supabaseService.saveSettings(partial).catch(console.error);
  }, [companyId]);

  useEffect(() => { localStorage.setItem(SETTINGS_KEY_SOURCES, JSON.stringify(sources)); }, [sources]);
  useEffect(() => { localStorage.setItem(STAGES_KEY, JSON.stringify(stages)); }, [stages]);
  useEffect(() => { localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(companyProfile)); }, [companyProfile]);
  useEffect(() => { localStorage.setItem(TEST_LIBRARY_KEY, JSON.stringify(testLibrary)); }, [testLibrary]);
  useEffect(() => { localStorage.setItem(SLA_SETTINGS_KEY, JSON.stringify(slaSettings)); }, [slaSettings]);
  useEffect(() => { localStorage.setItem(SCORECARD_TEMPLATES_KEY, JSON.stringify(scorecardTemplates)); }, [scorecardTemplates]);

  const setKavenegarApiKey = (key: string) => {
    setKavenegarApiKeyState(key);
    localStorage.setItem(KAVENEGAR_API_KEY, key);
  };

  // ── Sources ──────────────────────────────────────────────────────────

  const addSource = (source: string) => {
    const t = source.trim();
    if (t && !sources.find(s => s.toLowerCase() === t.toLowerCase())) {
      const next = [...sources, t];
      setSources(next);
      syncToSupabase({ sources: next });
      addToast(`منبع "${t}" اضافه شد.`, 'success');
    } else {
      addToast('منبع تکراری یا خالی است.', 'error');
    }
  };

  const deleteSource = (s: string) => {
    const next = sources.filter(x => x !== s);
    setSources(next);
    syncToSupabase({ sources: next });
    addToast(`منبع "${s}" حذف شد.`, 'success');
  };

  // ── Stages ───────────────────────────────────────────────────────────

  const setStageOrder = (ordered: KanbanStage[]) => {
    setStages(ordered);
    syncToSupabase({ stages: ordered });
    addToast('ترتیب مراحل ذخیره شد.', 'success');
  };

  const addStage = (title: string) => {
    const t = title.trim();
    if (t && !stages.find(s => s.title.toLowerCase() === t.toLowerCase())) {
      const next = [...stages, { id: `stage_${Date.now()}`, title: t, isCore: false }];
      setStages(next);
      syncToSupabase({ stages: next });
      addToast(`مرحله "${t}" اضافه شد.`, 'success');
    } else {
      addToast('عنوان مرحله تکراری یا خالی است.', 'error');
    }
  };

  const updateStage = (id: string, title: string) => {
    const t = title.trim();
    if (!t) { addToast('عنوان مرحله نمی‌تواند خالی باشد.', 'error'); return; }
    const next = stages.map(s => s.id === id ? { ...s, title: t } : s);
    setStages(next);
    syncToSupabase({ stages: next });
    addToast('مرحله به‌روزرسانی شد.', 'success');
  };

  const deleteStage = (id: string) => {
    const stage = stages.find(s => s.id === id);
    if (!stage) return;
    if (stage.isCore) { addToast('نمی‌توان مراحل اصلی سیستم را حذف کرد.', 'error'); return; }
    const next = stages.filter(s => s.id !== id);
    setStages(next);
    syncToSupabase({ stages: next });
    addToast(`مرحله "${stage.title}" حذف شد.`, 'success');
  };

  // ── Company profile ──────────────────────────────────────────────────

  const updateCompanyDetails = (details: Partial<Omit<CompanyProfile, 'jobPositions'>>) => {
    const next = { ...companyProfile, ...details };
    setCompanyProfile(next);
    syncToSupabase({ companyProfile: next });
    addToast('اطلاعات شرکت به‌روزرسانی شد.', 'success');
  };

  const addJobPosition = (title: string) => {
    const t = title.trim();
    if (t && !companyProfile.jobPositions.find(j => j.title.toLowerCase() === t.toLowerCase())) {
      const next = { ...companyProfile, jobPositions: [...companyProfile.jobPositions, { id: `job_${Date.now()}`, title: t }] };
      setCompanyProfile(next);
      syncToSupabase({ companyProfile: next });
      addToast(`موقعیت شغلی "${t}" اضافه شد.`, 'success');
    } else {
      addToast('موقعیت شغلی تکراری یا خالی است.', 'error');
    }
  };

  const updateJobPosition = (id: string, title: string) => {
    const t = title.trim();
    if (!t) { addToast('عنوان نمی‌تواند خالی باشد.', 'error'); return; }
    const next = { ...companyProfile, jobPositions: companyProfile.jobPositions.map(j => j.id === id ? { ...j, title: t } : j) };
    setCompanyProfile(next);
    syncToSupabase({ companyProfile: next });
    addToast('موقعیت شغلی به‌روزرسانی شد.', 'success');
  };

  const deleteJobPosition = (id: string) => {
    const next = { ...companyProfile, jobPositions: companyProfile.jobPositions.filter(j => j.id !== id) };
    setCompanyProfile(next);
    syncToSupabase({ companyProfile: next });
    addToast('موقعیت شغلی حذف شد.', 'success');
  };

  // ── Test library ─────────────────────────────────────────────────────

  const addTest = (test: Omit<TestLibraryItem, 'id'>) => {
    if (!test.name.trim() || !test.url.trim()) { addToast('نام و لینک آزمون نمی‌تواند خالی باشد.', 'error'); return; }
    const next = [...testLibrary, { ...test, id: `test_${Date.now()}` }];
    setTestLibrary(next);
    syncToSupabase({ testLibrary: next });
    addToast(`آزمون "${test.name}" اضافه شد.`, 'success');
  };

  const updateTest = (updated: TestLibraryItem) => {
    if (!updated.name.trim() || !updated.url.trim()) { addToast('نام و لینک آزمون نمی‌تواند خالی باشد.', 'error'); return; }
    const next = testLibrary.map(t => t.id === updated.id ? updated : t);
    setTestLibrary(next);
    syncToSupabase({ testLibrary: next });
    addToast(`آزمون "${updated.name}" به‌روزرسانی شد.`, 'success');
  };

  const deleteTest = (id: string) => {
    const next = testLibrary.filter(t => t.id !== id);
    setTestLibrary(next);
    syncToSupabase({ testLibrary: next });
    addToast('آزمون حذف شد.', 'success');
  };

  // ── SLA ──────────────────────────────────────────────────────────────

  const updateStageSLA = (stageId: string, days: number) => {
    const next = { ...slaSettings, [stageId]: days };
    setSlaSettings(next);
    syncToSupabase({ slaSettings: next });
    addToast('SLA مرحله ذخیره شد.', 'success');
  };

  // ── Scorecard ────────────────────────────────────────────────────────

  const addScorecardCriteria = (stageId: string, name: string, weight: number) => {
    const t = name.trim();
    if (!t) { addToast('نام معیار نمی‌تواند خالی باشد.', 'error'); return; }
    const next = { ...scorecardTemplates, [stageId]: [...(scorecardTemplates[stageId] || []), { id: generateId('cr'), name: t, weight }] };
    setScorecardTemplates(next);
    syncToSupabase({ scorecardTemplates: next });
    addToast(`معیار "${t}" اضافه شد.`, 'success');
  };

  const updateScorecardCriteria = (stageId: string, criteria: ScorecardCriteria) => {
    const next = { ...scorecardTemplates, [stageId]: (scorecardTemplates[stageId] || []).map(c => c.id === criteria.id ? criteria : c) };
    setScorecardTemplates(next);
    syncToSupabase({ scorecardTemplates: next });
    addToast('معیار به‌روزرسانی شد.', 'success');
  };

  const deleteScorecardCriteria = (stageId: string, criteriaId: string) => {
    const next = { ...scorecardTemplates, [stageId]: (scorecardTemplates[stageId] || []).filter(c => c.id !== criteriaId) };
    setScorecardTemplates(next);
    syncToSupabase({ scorecardTemplates: next });
    addToast('معیار حذف شد.', 'success');
  };

  // ── Restore ──────────────────────────────────────────────────────────

  const restoreSettings = (settings: {
    sources: string[];
    stages: KanbanStage[];
    companyProfile: CompanyProfile;
    testLibrary: TestLibraryItem[];
    slaSettings?: Record<string, number>;
    scorecardTemplates?: Record<string, ScorecardCriteria[]>;
  }) => {
    if (!settings) { addToast('داده‌های تنظیمات در فایل پشتیبان یافت نشد.', 'error'); return; }
    if (settings.sources)            setSources(settings.sources);
    if (settings.stages)             setStages(settings.stages);
    if (settings.companyProfile)     setCompanyProfile(settings.companyProfile);
    if (settings.testLibrary)        setTestLibrary(settings.testLibrary);
    if (settings.slaSettings)        setSlaSettings(settings.slaSettings);
    if (settings.scorecardTemplates) setScorecardTemplates(settings.scorecardTemplates);
    syncToSupabase({
      sources: settings.sources,
      stages: settings.stages,
      companyProfile: settings.companyProfile,
      testLibrary: settings.testLibrary,
      slaSettings: settings.slaSettings,
      scorecardTemplates: settings.scorecardTemplates,
    });
    addToast('تنظیمات برنامه بازیابی شد.', 'success');
  };

  const value: SettingsContextType = {
    sources, addSource, deleteSource,
    stages, setStageOrder, addStage, updateStage, deleteStage,
    companyProfile, updateCompanyDetails, addJobPosition, updateJobPosition, deleteJobPosition,
    testLibrary, addTest, updateTest, deleteTest,
    slaSettings, updateStageSLA,
    scorecardTemplates, addScorecardCriteria, updateScorecardCriteria, deleteScorecardCriteria,
    kavenegarApiKey, setKavenegarApiKey,
    restoreSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
