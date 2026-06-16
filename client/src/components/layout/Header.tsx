import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useToast } from '../../contexts/ToastContext';
import { Candidate } from '../../types';
import { migrationService } from '../../services/migrationService';
import { useSettings } from '../../contexts/SettingsContext';
import { useTemplates } from '../../contexts/TemplateContext';
import { useTheme } from '../../contexts/ThemeContext';

declare const persianDate: any;

interface HeaderProps {
    onSettingsClick: () => void;
    onAddCandidateClick: () => void;
    onBulkUploadClick: () => void;
    onOpenBulkCommModal: (candidates: Candidate[]) => void;
}

const IconBtn: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-all duration-200"
  >
    {children}
  </button>
);

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onAddCandidateClick, onBulkUploadClick, onOpenBulkCommModal }) => {
  const { user, logout, users, restoreUsers } = useAuth();
  const { candidates, setCandidates } = useCandidates();
  const { addToast } = useToast();
  const { sources, stages, companyProfile, testLibrary, restoreSettings } = useSettings();
  const { templates, restoreTemplates } = useTemplates();
  const { theme, background, restoreTheme } = useTheme();
  const restoreInputRef = React.useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const appVersion = '1.1.0';
    const backupData = {
        version: appVersion,
        createdAt: new Date().toISOString(),
        data: { candidates, settings: { sources, stages, companyProfile, testLibrary }, templates, users, theme: { theme, background } }
    };
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recruitment_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('پشتیبان‌گیری با موفقیت انجام شد.', 'success');
  };

  const handleRestoreClick = () => restoreInputRef.current?.click();

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
            if(data.settings) restoreSettings(data.settings);
            if(data.templates) restoreTemplates(data.templates);
            if(data.users) restoreUsers(data.users);
            if(data.theme) restoreTheme(data.theme);
            const migratedCandidates = migrationService.migrate(data.candidates, version || '1.0.0');
            await setCandidates(migratedCandidates, true);
            addToast('بازیابی کامل داده‌ها با موفقیت انجام شد!', 'success');
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
            const migratedCandidates = migrationService.migrate(candidatesToRestore, backupVersion);
            await setCandidates(migratedCandidates);
        }
      } catch (error: any) {
        addToast(error.message || 'خطا در بازیابی فایل.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleBulkReminder = () => {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayStr = today.toISOString().split('T')[0].replace(/-/g, '/');
        const tomorrowStr = tomorrow.toISOString().split('T')[0].replace(/-/g, '/');
        const nonActiveStages = ['hired', 'rejected', 'archived'];
        const upcomingInterviews = candidates.filter(c => {
            if (!c.interviewDate || nonActiveStages.includes(c.stage)) return false;
            try {
                const interviewDate = new Date(c.interviewDate);
                const formattedInterviewDate = interviewDate.toISOString().split('T')[0].replace(/-/g, '/');
                return formattedInterviewDate === todayStr || formattedInterviewDate === tomorrowStr;
            } catch { return false; }
        });
        if (upcomingInterviews.length > 0) {
            onOpenBulkCommModal(upcomingInterviews);
        } else {
            addToast('هیچ مصاحبه‌ای برای امروز یا فردا وجود ندارد.', 'success');
        }
    } catch { addToast('خطا در بررسی یادآورها.', 'error'); }
  };

  const initials = user?.name ? user.name.trim().charAt(0) : '؟';

  return (
    <header
      className="sticky top-0 z-30 shadow-lg"
      style={{ background: 'linear-gradient(135deg, var(--color-primary-800) 0%, var(--color-primary-600) 100%)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        {/* Left: Logo + Add button */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-base font-bold text-white hidden sm:block tracking-wide">داشبورد استخدام</h1>
          <button
            onClick={onAddCandidateClick}
            className="flex items-center gap-2 bg-white text-[var(--color-primary-700)] hover:bg-blue-50 text-sm font-bold py-2 px-4 rounded-xl transition-all duration-200 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>افزودن</span>
          </button>
          <button
            onClick={onBulkUploadClick}
            className="flex items-center gap-2 bg-white/20 text-white hover:bg-white/30 text-sm font-bold py-2 px-4 rounded-xl transition-all duration-200 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>آپلود گروهی</span>
          </button>
        </div>

        {/* Center: Action icon buttons */}
        <div className="flex items-center gap-1">
          <IconBtn onClick={handleBulkReminder} title="یادآور گروهی">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </IconBtn>
          <IconBtn onClick={handleBackup} title="پشتیبان‌گیری">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </IconBtn>
          <IconBtn onClick={handleRestoreClick} title="بازیابی">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </IconBtn>
          <input type="file" ref={restoreInputRef} className="hidden" accept=".json" onChange={handleRestore} />
        </div>

        {/* Right: User + Settings + Logout */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-sm font-bold text-white">
                {initials}
              </div>
              <span className="text-sm text-white/80 hidden md:block font-medium">{user.name}</span>
            </div>
          )}
          {user && (
            <IconBtn onClick={onSettingsClick} title="تنظیمات">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </IconBtn>
          )}
          <button
            onClick={logout}
            className="text-sm border border-white/30 text-white/90 hover:bg-white/15 font-medium py-1.5 px-3 rounded-xl transition-all duration-200"
          >
            خروج
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
