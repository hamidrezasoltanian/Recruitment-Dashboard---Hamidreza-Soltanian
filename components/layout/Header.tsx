import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useToast } from '../../contexts/ToastContext';
import { Candidate } from '../../types';

declare const persianDate: any;

interface HeaderProps {
    onSettingsClick: () => void;
    onAddCandidateClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onAddCandidateClick }) => {
  const { user, logout } = useAuth();
  const { candidates, setCandidates } = useCandidates();
  const { addToast } = useToast();
  const restoreInputRef = React.useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    if (candidates.length === 0) {
      addToast('هیچ داده‌ای برای پشتیبان‌گیری وجود ندارد.', 'error');
      return;
    }
    const dataStr = JSON.stringify(candidates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `recruitment_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('پشتیبان‌گیری با موفقیت انجام شد.', 'success');
  };

  const handleRestoreClick = () => {
    restoreInputRef.current?.click();
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File content is not valid');
        const restoredCandidates = JSON.parse(text) as Candidate[];
        // Basic validation
        if (!Array.isArray(restoredCandidates) || !restoredCandidates.every(c => c.id && c.name && c.stage)) {
            throw new Error('فایل پشتیبان معتبر نیست.');
        }
        setCandidates(restoredCandidates);
        addToast('داده‌ها با موفقیت بازیابی شدند.', 'success');
      } catch (error) {
        addToast('خطا در بازیابی فایل. لطفاً از معتبر بودن فایل اطمینان حاصل کنید.', 'error');
        console.error("Restore error:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };
  
  const handleBulkReminder = () => {
    const today = new persianDate();
    const todayStr = today.format('YYYY/MM/DD');
    const tomorrow = today.add('days', 1);
    const tomorrowStr = tomorrow.format('YYYY/MM/DD');

    const upcomingInterviews = candidates.filter(c => 
      c.interviewDate === todayStr || c.interviewDate === tomorrowStr
    );

    if (upcomingInterviews.length > 0) {
      const names = upcomingInterviews.map(c => `- ${c.name} (${c.position})`).join('\n');
      alert(`یادآوری برای مصاحبه‌های زیر در امروز و فردا:\n\n${names}`);
      addToast(`${upcomingInterviews.length} یادآور مصاحبه یافت شد.`, 'success');
    } else {
        addToast('هیچ مصاحبه‌ای برای امروز یا فردا وجود ندارد.', 'success');
    }
  };


  return (
    <header className="bg-white shadow-md p-4 flex flex-wrap justify-between items-center sticky top-0 z-30 gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">داشبورد استخدام</h1>
        <button onClick={onAddCandidateClick} className="text-sm bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            <span>افزودن سریع</span>
        </button>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={handleBulkReminder} className="text-sm bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">یادآور مصاحبه</button>
        <button onClick={handleBackup} className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">پشتیبان‌گیری</button>
        <input type="file" id="restore-input" ref={restoreInputRef} className="hidden" accept=".json" onChange={handleRestore} />
        <button onClick={handleRestoreClick} className="text-sm bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">بازیابی</button>
      </div>
      
      <div className="flex items-center gap-4">
        {user && <span className="text-sm text-gray-600 font-medium">خوش آمدید، {user.name}</span>}
        {user?.isAdmin && (
            <button onClick={onSettingsClick} className="text-sm bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">تنظیمات</button>
        )}
        <button onClick={logout} className="text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">خروج</button>
      </div>
    </header>
  );
};

export default Header;
