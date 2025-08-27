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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

    const interviewsForTomorrow = candidates.filter(c => {
      if (!c.interviewDate) return false;
      const interviewDateObj = new Date(c.interviewDate);
      return interviewDateObj >= tomorrow && interviewDateObj < dayAfterTomorrow;
    });

    if (interviewsForTomorrow.length > 0) {
      const uniqueInterviewers = new Set<string>();

      console.log('--- Sending Interview Reminders for TOMORROW (Manual Trigger) ---');
      interviewsForTomorrow.forEach(c => {
        const interviewDateTime = new Date(c.interviewDate!);
        const pDate = new persianDate(interviewDateTime);
        const formattedDate = pDate.format('dddd D MMMM');
        const formattedTime = c.interviewTime || new persianDate(interviewDateTime).format('HH:mm');
        
        // Log reminder for candidate (simulation)
        console.log(`[CANDIDATE REMINDER] To: ${c.name} (${c.email}) - Your interview for ${c.position} is tomorrow, ${formattedDate} at ${formattedTime}.`);
        
        if (c.interviewerName) {
            uniqueInterviewers.add(c.interviewerName);
            // Log reminder for interviewer (simulation)
            console.log(`[INTERVIEWER REMINDER] To: ${c.interviewerName} - You have an interview tomorrow with ${c.name} for ${c.position} on ${formattedDate} at ${formattedTime}.`);
        }
      });
      console.log('-------------------------------------------------------------');
      
      let message = `${interviewsForTomorrow.length} مصاحبه برای فردا یافت شد.`;
      if (uniqueInterviewers.size > 0) {
          message += ` یادآوری برای ${uniqueInterviewers.size} مصاحبه‌کننده (در کنسول) ثبت شد.`
      }
      addToast(message, 'success');

    } else {
      addToast('هیچ مصاحبه‌ای برای فردا برنامه‌ریزی نشده است.', 'success');
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
