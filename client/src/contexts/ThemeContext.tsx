import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './ToastContext';

type Theme = 'indigo' | 'blue' | 'teal' | 'rose';
type Background = { type: 'default' } | { type: 'custom', url: string };

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  background: Background;
  setCustomBackground: (dataUrl: string) => void;
  setDefaultBackground: () => void;
  restoreTheme: (themeSettings: { theme: Theme; background: Background }) => void;
}

const THEME_KEY = 'recruitment_theme_v1';
const BACKGROUND_KEY = 'recruitment_background_v1';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      return storedTheme || 'indigo';
    } catch {
      return 'indigo';
    }
  });

  const [background, setBackgroundState] = useState<Background>(() => {
    try {
      const storedBg = localStorage.getItem(BACKGROUND_KEY);
      return storedBg ? JSON.parse(storedBg) : { type: 'default' };
    } catch {
      return { type: 'default' };
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme colors
    const themeColors = {
      indigo: {
        '--color-primary-50': '#eef2ff',
        '--color-primary-100': '#e0e7ff',
        '--color-primary-200': '#c7d2fe',
        '--color-primary-300': '#a5b4fc',
        '--color-primary-400': '#818cf8',
        '--color-primary-500': '#6366f1',
        '--color-primary-600': '#4f46e5',
        '--color-primary-700': '#4338ca',
        '--color-primary-800': '#3730a3',
        '--color-primary-900': '#312e81',
      },
      blue: {
        '--color-primary-50': '#eff6ff',
        '--color-primary-100': '#dbeafe',
        '--color-primary-200': '#bfdbfe',
        '--color-primary-300': '#93c5fd',
        '--color-primary-400': '#60a5fa',
        '--color-primary-500': '#3b82f6',
        '--color-primary-600': '#2563eb',
        '--color-primary-700': '#1d4ed8',
        '--color-primary-800': '#1e40af',
        '--color-primary-900': '#1e3a8a',
      },
      teal: {
        '--color-primary-50': '#f0fdfa',
        '--color-primary-100': '#ccfbf1',
        '--color-primary-200': '#99f6e4',
        '--color-primary-300': '#5eead4',
        '--color-primary-400': '#2dd4bf',
        '--color-primary-500': '#14b8a6',
        '--color-primary-600': '#0d9488',
        '--color-primary-700': '#0f766e',
        '--color-primary-800': '#115e59',
        '--color-primary-900': '#134e4a',
      },
      rose: {
        '--color-primary-50': '#fff1f2',
        '--color-primary-100': '#ffe4e6',
        '--color-primary-200': '#fecdd3',
        '--color-primary-300': '#fda4af',
        '--color-primary-400': '#fb7185',
        '--color-primary-500': '#f43f5e',
        '--color-primary-600': '#e11d48',
        '--color-primary-700': '#be123c',
        '--color-primary-800': '#9f1239',
        '--color-primary-900': '#881337',
      },
    };

    const colors = themeColors[theme];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (background.type === 'custom') {
      document.body.style.backgroundImage = `url(${background.url})`;
    } else {
      document.body.style.backgroundImage = 'none';
    }
    localStorage.setItem(BACKGROUND_KEY, JSON.stringify(background));
  }, [background]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  const setCustomBackground = (dataUrl: string) => {
    setBackgroundState({ type: 'custom', url: dataUrl });
  };
  
  const setDefaultBackground = () => {
    setBackgroundState({ type: 'default' });
  };

  const restoreTheme = (themeSettings: { theme: Theme; background: Background }) => {
      if (themeSettings) {
        if (themeSettings.theme) {
          setThemeState(themeSettings.theme);
        }
        if (themeSettings.background) {
          setBackgroundState(themeSettings.background);
        }
        addToast('تنظیمات ظاهری بازیابی شد.', 'success');
      }
  };

  const value = { theme, setTheme, background, setCustomBackground, setDefaultBackground, restoreTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};