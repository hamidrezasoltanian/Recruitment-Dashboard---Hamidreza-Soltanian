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
    onOpenBulkCommModal: (candidates: Candidate[]) => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onAddCandidateClick, onOpenBulkCommModal }) => {
  const { user, logout, users, restoreUsers } = useAuth();
  const { candidates, setCandidates } = useCandidates();
  const { addToast } = useToast();
  const { sources, stages, companyProfile, testLibrary, restoreSettings } = useSettings();
  const { templates, restoreTemplates } = useTemplates();
  const { theme, background, restoreTheme } = useTheme();
  const restoreInputRef = React.useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const appVersion = process.env.APP_VERSION || '1.1.0';
    const backupData = {
        version: appVersion,
        createdAt: new Date().toISOString(),
        data: {
            candidates: candidates,
            settings: {
                sources,
                stages,
                companyProfile,
                testLibrary
            },
            templates: templates,
            users: users,
            theme: {
                theme,
                background
            }
        }
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `recruitment_backup_full_v${appVersion}_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('پشتیبان‌گیری کامل از تمام داده‌ها انجام شد.', 'success');
  };

  const handleRestoreClick = () => {
    restoreInputRef.current?.click();
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

        // Check for the new, comprehensive format
        if (backup.data && backup.data.candidates) {
            const { data, version } = backup;
            
            // Restore all settings
            if(data.settings) restoreSettings(data.settings);
            if(data.templates) restoreTemplates(data.templates);
            if(data.users) restoreUsers(data.users);
            if(data.theme) restoreTheme(data.theme);

            // Restore candidates (with migration)
            const migratedCandidates = migrationService.migrate(data.candidates, version || '1.0.0');
            // Use await to ensure candidate restoration finishes before the final toast
            await setCandidates(migratedCandidates, true); // Suppress individual toast
            
            addToast('بازیابی کامل داده‌ها با موفقیت انجام شد!', 'success');
            // Optional: force a reload to ensure all components refresh with new context data
            setTimeout(() => window.location.reload(), 1500);

        } else { // Handle old format for backward compatibility
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
        addToast(error.message || 'خطا در بازیابی فایل. لطفاً از معتبر بودن فایل اطمینان حاصل کنید.', 'error');
        console.error("Restore error:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };
  
  // Helper function to convert Persian/Arabic numerals to Latin, making date parsing reliable.
  const toLatinDigits = (s: string) => {
    if (!s) return '';
    return s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
            .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  };

  const handleBulkReminder = () => {
    try {
        // Use string comparison for robustness, as persianDate object comparison can be tricky.
        const todayStr = new persianDate().format('YYYY/MM/DD');
        const tomorrowStr = new persianDate().add('days', 1).format('YYYY/MM/DD');

        const nonActiveStages = ['hired', 'rejected', 'archived'];

        const upcomingInterviews = candidates.filter(c => {
            if (!c.interviewDate || nonActiveStages.includes(c.stage)) {
                return false;
            }
            try {
                // 1. Convert any non-Latin digits to Latin digits.
                const latinDateStr = toLatinDigits(c.interviewDate);

                // 2. Parse the cleaned string into a date object.
                const interviewPDate = new persianDate(latinDateStr.split('/').map(Number));
                
                // 3. Format it to a standard YYYY/MM/DD format for reliable comparison.
                const formattedInterviewDate = interviewPDate.format('YYYY/MM/DD');

                // 4. Compare strings.
                return formattedInterviewDate === todayStr || formattedInterviewDate === tomorrowStr;
            } catch (e) {
                // This catch block will handle errors if the date string is fundamentally malformed (e.g., "abc/def/ghi").
                console.error(`Could not parse date for candidate ${c.name}: '${c.interviewDate}'`, e);
                return false;
            }
        });

        if (upcomingInterviews.length > 0) {
            onOpenBulkCommModal(upcomingInterviews);
        } else {
            addToast('هیچ مصاحبه‌ای برای امروز یا فردا وجود ندارد.', 'success');
        }
    } catch (e) {
        console.error("Error in handleBulkReminder:", e);
        addToast('خطا در بررسی یادآورها.', 'error');
    }
  };


  return (
    <header className="bg-white border-b border-gray-100 shadow-sm px-4 md:px-6 py-3 flex flex-wrap justify-between items-center sticky top-0 z-30 gap-3">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl shadow-sm" style={{background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))'}}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-lg md:text-xl font-extrabold text-gray-800">داشبورد استخدام</h1>
        <button
          onClick={onAddCandidateClick}
          className="flex items-center gap-1.5 text-sm font-bold text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
          style={{background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))'}}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          <span className="hidden sm:inline">افزودن سریع</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleBulkReminder}
          title="یادآور گروهی"
          className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <span className="hidden md:inline">یادآور</span>
        </button>
        <button
          onClick={handleBackup}
          title="پشتیبان‌گیری"
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span className="hidden md:inline">پشتیبان</span>
        </button>
        <input type="file" id="restore-input" ref={restoreInputRef} className="hidden" accept=".json" onChange={handleRestore} />
        <button
          onClick={handleRestoreClick}
          title="بازیابی"
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span className="hidden md:inline">بازیابی</span>
        </button>
      </div>

      {/* User menu */}
      <div className="flex items-center gap-2">
        {user && (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background: 'var(--color-primary-600)'}}>
              {user.name?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.name}</span>
          </div>
        )}
        {user?.isAdmin && (
          <button
            onClick={onSettingsClick}
            title="تنظیمات"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        )}
        <button
          onClick={logout}
          title="خروج"
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span className="hidden sm:inline">خروج</span>
        </button>
      </div>
    </header>
  );
};

export default Header;