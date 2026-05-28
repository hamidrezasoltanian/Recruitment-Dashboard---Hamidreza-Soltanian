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
  darkMode: boolean;
  toggleDarkMode: () => void;
  restoreTheme: (themeSettings: { theme: Theme; background: Background; darkMode?: boolean }) => void;
}

const THEME_KEY = 'recruitment_theme_v1';
const BACKGROUND_KEY = 'recruitment_background_v1';
const DARK_MODE_KEY = 'recruitment_dark_mode_v1';

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

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(DARK_MODE_KEY);
      if (stored !== null) return JSON.parse(stored);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const classes = [`theme-${theme}`];
    if (darkMode) classes.push('dark-mode');
    document.body.className = classes.join(' ');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, darkMode]);

  useEffect(() => {
    if (background.type === 'custom') {
      document.body.style.backgroundImage = `url(${background.url})`;
    } else {
      document.body.style.backgroundImage = 'none';
    }
    localStorage.setItem(BACKGROUND_KEY, JSON.stringify(background));
  }, [background]);

  useEffect(() => {
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(darkMode));
  }, [darkMode]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);

  const setCustomBackground = (dataUrl: string) => setBackgroundState({ type: 'custom', url: dataUrl });

  const setDefaultBackground = () => setBackgroundState({ type: 'default' });

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const restoreTheme = (themeSettings: { theme: Theme; background: Background; darkMode?: boolean }) => {
    if (themeSettings) {
      if (themeSettings.theme) setThemeState(themeSettings.theme);
      if (themeSettings.background) setBackgroundState(themeSettings.background);
      if (typeof themeSettings.darkMode === 'boolean') setDarkMode(themeSettings.darkMode);
      addToast('تنظیمات ظاهری بازیابی شد.', 'success');
    }
  };

  const value = { theme, setTheme, background, setCustomBackground, setDefaultBackground, darkMode, toggleDarkMode, restoreTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
