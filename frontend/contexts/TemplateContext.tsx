import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Template } from '../types';
import { DEFAULT_TEMPLATES } from '../constants';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface TemplateContextType {
  templates: Template[];
  isLoading: boolean;
  addTemplate: (template: Omit<Template, 'id'>) => Promise<void>;
  updateTemplate: (template: Template) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) throw new Error('useTemplates must be used within a TemplateProvider');
  return context;
};

export const TemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
        const serverTemplates = await api.get<Template[]>('/templates');
        setTemplates(serverTemplates);
    } catch (error: any) {
        addToast(`خطا در بارگذاری قالب‌ها: ${error.message}`, 'error');
        // Fallback to default templates on error
        setTemplates(DEFAULT_TEMPLATES);
    } finally {
        setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTemplates();
    }
  }, [isAuthenticated, fetchTemplates]);

  const addTemplate = async (templateData: Omit<Template, 'id'>) => {
    if (!templateData.name.trim() || !templateData.content.trim()) {
      addToast('نام و محتوای قالب نمی‌تواند خالی باشد.', 'error');
      return;
    }
    try {
      await api.post('/templates', templateData);
      addToast(`قالب "${templateData.name}" اضافه شد.`, 'success');
      await fetchTemplates();
    } catch (error: any) {
      addToast(`خطا در افزودن قالب: ${error.message}`, 'error');
    }
  };

  const updateTemplate = async (updatedTemplate: Template) => {
    if (!updatedTemplate.name.trim() || !updatedTemplate.content.trim()) {
      addToast('نام و محتوای قالب نمی‌تواند خالی باشد.', 'error');
      return;
    }
    try {
      await api.put(`/templates/${updatedTemplate.id}`, updatedTemplate);
      addToast(`قالب "${updatedTemplate.name}" به‌روزرسانی شد.`, 'success');
      await fetchTemplates();
    } catch (error: any) {
      addToast(`خطا در به‌روزرسانی قالب: ${error.message}`, 'error');
    }
  };

  const deleteTemplate = async (id: string) => {
    const templateToDelete = templates.find(t => t.id === id);
    try {
        await api.delete(`/templates/${id}`);
        if (templateToDelete) {
            addToast(`قالب "${templateToDelete.name}" حذف شد.`, 'success');
        }
        await fetchTemplates();
    } catch (error: any) {
        addToast(`خطا در حذف قالب: ${error.message}`, 'error');
    }
  };
  
  const value = { templates, isLoading, addTemplate, updateTemplate, deleteTemplate };

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
};
