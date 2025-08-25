import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useToast } from '../../contexts/ToastContext';

declare const persianDate: any;

interface HeaderProps {
    onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  const { user, logout } = useAuth();
  const { candidates } = useCandidates();
  const { addToast } = useToast();
  
  const handleBulkReminder = () => {
    const today = new persianDate();
    const todayStr = today.format('YYYY/MM/DD');
    const tomorrow = today.add('days', 1);
    const tomorrowStr = tomorrow.format('YYYY/MM/DD');

    const upcomingInterviews = candidates.filter(c => 
      (c.stage === 'interview-1' || c.stage === 'interview-2') && 
      (c.interviewDate === todayStr || c.interviewDate === tomorrowStr)
    );

    if(upcomingInterviews.length > 0) {
        addToast(`${upcomingInterviews.length} مصاحبه برای امروز و فردا برنامه‌ریزی شده است.`, 'success');
    } else {
        addToast('هیچ مصاحبه‌ای برای امروز یا فردا وجود ندارد.', 'success');
    }
  };


  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-md p-4 flex flex-wrap justify-between items-center sticky top-0 z-30 gap-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800">داشبورد استخدام</h1>
      
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={handleBulkReminder} className="text-sm bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">یادآور مصاحبه</button>
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
