import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Template } from '../types';
import { apiService } from '../services/apiService';
import { DEFAULT_TEMPLATES } from '../constants';
import { useAuth } from './AuthContext';

interface TemplateContextType {
  templates: Template[];
  addTemplate: (template: Omit<Template, 'id'>) => Promise<void>;
  updateTemplate: (id: string, template: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  restoreTemplates: (templates: Template[]) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) throw new Error('useTemplates must be used within TemplateProvider');
  return context;
};

export const TemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    apiService.getTemplates().then(data => {
      if (data && data.length > 0) setTemplates(data as any);
    }).catch(() => {});
  }, [user]);

  const addTemplate = async (template: Omit<Template, 'id'>) => {
    try {
      const created = await apiService.createTemplate(template as any);
      setTemplates(prev => [...prev, created as any]);
    } catch {
      setTemplates(prev => [...prev, { ...template, id: `tpl_${Date.now()}` } as Template]);
    }
  };

  const updateTemplate = async (id: string, template: Partial<Template>) => {
    try {
      await apiService.updateTemplate(id, template as any);
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...template } : t));
    } catch {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...template } : t));
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await apiService.deleteTemplate(id);
    } catch {}
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const restoreTemplates = (newTemplates: Template[]) => setTemplates(newTemplates);

  const value = { templates, addTemplate, updateTemplate, deleteTemplate, restoreTemplates };
  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
};
