import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { KanbanStage, CompanyProfile, TestLibraryItem } from '../types';
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
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => Promise<void>;
  updateTestLibrary: (items: TestLibraryItem[]) => void;
  restoreSettings: (data: any) => void;
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
  const updateCompanyProfile = async (profile: Partial<CompanyProfile>) => {
    try {
      const updated = await apiService.updateCompanyProfile(profile);
      setCompanyProfile(prev => ({ ...prev, ...updated }));
    } catch {
      setCompanyProfile(prev => ({ ...prev, ...profile }));
    }
  };
  const updateTestLibrary = (items: TestLibraryItem[]) => setTestLibrary(items);
  const restoreSettings = (data: any) => {
    if (data.sources) setSources(data.sources);
    if (data.stages) setStages(data.stages);
    if (data.companyProfile) setCompanyProfile(data.companyProfile);
    if (data.testLibrary) setTestLibrary(data.testLibrary);
  };

  const value = { sources, stages, companyProfile, testLibrary, updateSources, addSource, deleteSource, updateStages, updateCompanyProfile, updateTestLibrary, restoreSettings };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
