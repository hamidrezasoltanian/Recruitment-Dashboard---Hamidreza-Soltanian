import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useToast } from '../../contexts/ToastContext';
import { Candidate } from '../../types';
import { migrationService } from '../../services/migrationService';
import { useSettings } from '../../contexts/SettingsContext';
import { useTemplates } from '../../contexts/TemplateContext';
import { useTheme } from '../../contexts/ThemeContext';

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const CloseMenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

declare const persianDate: any;

interface HeaderProps {
  onSettingsClick: () => void;
  onAddCandidateClick: () => void;
  onOpenBulkCommModal: (candidates: Candidate[]) => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onAddCandidateClick, onOpenBulkCommModal }) => {
  const { user, logout, users, restoreUsers } = useAuth();
  const { candidates, setCandidates } = useCandidates();
  const { addToast } = useToast();
  const { sources, stages, companyProfile, testLibrary, restoreSettings } = useSettings();
  const { templates, restoreTemplates } = useTemplates();
  const { theme, background, darkMode, toggleDarkMode, restoreTheme } = useTheme();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBackup = () => {
    const appVersion = process.env.APP_VERSION || '1.1.0';
    const backupData = {
      version: appVersion,
      createdAt: new Date().toISOString(),
      data: { candidates, settings: { sources, stages, companyProfile, testLibrary }, templates, users, theme: { theme, background } },
    };
    const dataBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recruitment_backup_v${appVersion}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('پشتیبان‌گیری کامل انجام شد.', 'success');
    setMenuOpen(false);
  };

  const handleRestoreClick = () => {
    restoreInputRef.current?.click();
    setMenuOpen(false);
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File content is not valid');
        const backup = JSON.parse(text);
        if (backup.data && backup.data.candidates) {
          const { data, version } = backup;
          if (data.settings) restoreSettings(data.settings);
          if (data.templates) restoreTemplates(data.templates);
          if (data.users) restoreUsers(data.users);
          if (data.theme) restoreTheme(data.theme);
          const migrated = migrationService.migrate(data.candidates, version || '1.0.0');
          await setCandidates(migrated, true);
          addToast('بازیابی کامل داده‌ها با موفقیت انجام شد!', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          let candidatesToRestore: Candidate[];
          let backupVersion = '1.0.0';
          if (Array.isArray(backup)) {
            candidatesToRestore = backup;
          } else if (backup.candidates && backup.version) {
            candidatesToRestore = backup.candidates;
            backupVersion = backup.version;
          } else {
            throw new Error('فرمت فایل پشتیبان ناشناخته است.');
          }
          await setCandidates(migrationService.migrate(candidatesToRestore, backupVersion));
        }
      } catch (error: any) {
        addToast(error.message || 'خطا در بازیابی فایل.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const toLatinDigits = (s: string) =>
    s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
     .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

  const handleBulkReminder = () => {
    try {
      const todayStr = new persianDate().format('YYYY/MM/DD');
      const tomorrowStr = new persianDate().add('days', 1).format('YYYY/MM/DD');
      const nonActive = ['hired', 'rejected', 'archived'];
      const upcoming = candidates.filter(c => {
        if (!c.interviewDate || nonActive.includes(c.stage)) return false;
        try {
          const d = new persianDate(toLatinDigits(c.interviewDate).split('/').map(Number));
          const f = d.format('YYYY/MM/DD');
          return f === todayStr || f === tomorrowStr;
        } catch { return false; }
      });
      if (upcoming.length > 0) onOpenBulkCommModal(upcoming);
      else addToast('هیچ مصاحبه‌ای برای امروز یا فردا وجود ندارد.', 'success');
    } catch (e) {
      addToast('خطا در بررسی یادآورها.', 'error');
    }
    setMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-30">
      {/* Main bar */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 gap-2">
        {/* Left: title + add button */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 whitespace-nowrap">داشبورد استخدام</h1>
          <button
            onClick={onAddCandidateClick}
            className="flex items-center gap-1 text-xs sm:text-sm bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-bold py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="hidden xs:inline sm:inline">افزودن</span>
          </button>
        </div>

        {/* Right: always-visible buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Dark mode toggle — always visible */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'حالت روشن' : 'حالت تاریک'}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Desktop-only quick buttons */}
          <button onClick={handleBulkReminder} className="hidden sm:block text-sm bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded-lg transition-colors whitespace-nowrap">یادآور</button>
          <button onClick={handleBackup} className="hidden sm:block text-sm bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg transition-colors">پشتیبان</button>
          <button onClick={handleRestoreClick} className="hidden sm:block text-sm bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg transition-colors">بازیابی</button>
          {user?.isAdmin && (
            <button onClick={() => { onSettingsClick(); setMenuOpen(false); }} className="hidden sm:block text-sm bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-colors">تنظیمات</button>
          )}

          {/* User greeting — desktop only */}
          {user && <span className="hidden md:block text-sm text-gray-600 font-medium whitespace-nowrap">{user.name}</span>}

          {/* Logout — desktop only */}
          <button onClick={logout} className="hidden sm:block text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg transition-colors">خروج</button>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="sm:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            aria-label="منوی بیشتر"
          >
            {menuOpen ? <CloseMenuIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white shadow-lg px-4 py-3 flex flex-col gap-2">
          {user && (
            <p className="text-sm text-gray-600 font-medium pb-1 border-b border-gray-100">
              خوش آمدید، <strong>{user.name}</strong>
            </p>
          )}
          <button onClick={handleBulkReminder} className="text-sm bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg text-right">یادآور گروهی</button>
          <button onClick={handleBackup} className="text-sm bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg text-right">پشتیبان‌گیری</button>
          <button onClick={handleRestoreClick} className="text-sm bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg text-right">بازیابی از فایل</button>
          {user?.isAdmin && (
            <button onClick={() => { onSettingsClick(); setMenuOpen(false); }} className="text-sm bg-gray-600 text-white font-bold py-2.5 px-4 rounded-lg text-right">تنظیمات</button>
          )}
          <button onClick={() => { logout(); setMenuOpen(false); }} className="text-sm bg-red-500 text-white font-bold py-2.5 px-4 rounded-lg text-right">خروج از سیستم</button>
        </div>
      )}

      <input type="file" ref={restoreInputRef} className="hidden" accept=".json" onChange={handleRestore} />
    </header>
  );
};

export default Header;
