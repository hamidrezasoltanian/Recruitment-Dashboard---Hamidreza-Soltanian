import React, { useState, useMemo } from 'react';
import { useCandidates } from '../../contexts/CandidatesContext';
import { Candidate } from '../../types';
import { getJobColor } from '../../utils/colorUtils';
// @ts-ignore
import moment from 'moment-jalaali';

// Let TypeScript know about the global persianDate object
declare const persianDate: any;

interface CalendarViewProps {
  onViewDetails: (candidate: Candidate) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onViewDetails }) => {
  const { candidates } = useCandidates();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const candidatesWithInterview = useMemo(() => 
    candidates.filter(c => c.interviewDate && (c.stage.includes('interview') || c.stage === 'hired')),
    [candidates]
  );

  const monthData = useMemo(() => {
    // Convert current date to Persian calendar using moment-jalaali
    const persianMoment = moment(currentDate);
    const persianYear = persianMoment.jYear();
    const persianMonth = persianMoment.jMonth() + 1; // jMonth() is 0-based
    
    // Get the first day of the Persian month
    const firstDayOfPersianMonth = moment(`${persianYear}/${String(persianMonth).padStart(2, '0')}/01`, 'jYYYY/jMM/jDD');
    const lastDayOfPersianMonth = firstDayOfPersianMonth.clone().endOf('jMonth');
    const lastDay = lastDayOfPersianMonth.jDate();
    
    // Get the day of week for the first day (0: Saturday, 1: Sunday, ..., 6: Friday)
    // In Persian calendar, Saturday is 0, but in JavaScript it's 6
    // We need to adjust the mapping
    const jsDay = firstDayOfPersianMonth.day(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const firstDayOfWeek = jsDay === 6 ? 0 : jsDay + 1; // Convert to Persian: 0=Saturday, 1=Sunday, ..., 6=Friday
    
    const days = Array.from({ length: lastDay }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

    return { year: persianYear, month: persianMonth, days, blanks };
  }, [currentDate]);

  const changeMonth = (amount: number) => {
    const persianMoment = moment(currentDate);
    const newPersianMoment = persianMoment.clone().add(amount, 'jMonth');
    setCurrentDate(newPersianMoment.toDate());
  };
  
  const getCandidatesForDay = (day: number) => {
      return candidatesWithInterview.filter(c => {
        if (!c.interviewDate) return false;
        
        try {
          // Convert Persian date to Gregorian using moment-jalaali
          const persianDateStr = `${monthData.year}/${String(monthData.month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
          const persianMoment = moment(persianDateStr, 'jYYYY/jMM/jDD');
          const gregorianDateStr = persianMoment.format('YYYY-MM-DD');
          
          // Compare with stored date (which is in Gregorian format)
          return c.interviewDate === gregorianDateStr;
        } catch (e) {
          console.error('Error comparing dates:', e);
          return false;
        }
      }).sort((a, b) => {
        // Sort by interview time, putting candidates without a time at the end
        if (a.interviewTime && b.interviewTime) {
          return a.interviewTime.localeCompare(b.interviewTime);
        }
        return a.interviewTime ? -1 : 1;
      });
  };

  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <h2 className="text-xl font-bold text-gray-800">{currentDate.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' })}</h2>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map(day => <div key={day} className="font-bold text-gray-600 p-2">{day}</div>)}
        {monthData.blanks.map(blank => <div key={`blank-${blank}`} className="border rounded-md border-gray-100"></div>)}
        {monthData.days.map(day => {
            const dayCandidates = getCandidatesForDay(day);
            const today = moment();
            const todayPersian = moment(today).format('jYYYY/jMM/jDD');
            const dayStr = `${monthData.year}/${String(monthData.month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
            const isToday = todayPersian === dayStr;
            return (
                <div key={day} className="border rounded-md border-gray-200 bg-gray-50 p-2 min-h-[120px] flex flex-col">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${isToday ? 'bg-[var(--color-primary-600)] text-white font-bold' : ''}`}>{day}</span>
                    <div className="flex-grow mt-1 space-y-1 overflow-y-auto kanban-cards pr-1"> {/* Re-using kanban-cards for custom scrollbar */}
                        {dayCandidates.map(c => {
                          const jobColor = getJobColor(c.position);
                          return (
                            <div 
                              key={c.id} 
                              onClick={() => onViewDetails(c)} 
                              className="bg-white text-right p-1.5 rounded-md cursor-pointer hover:shadow-md transition-shadow border-r-4"
                              style={{ borderColor: jobColor }}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-800 truncate pr-1">{c.name}</span>
                                    {c.interviewTime && <span className="text-xs font-semibold text-white bg-[var(--color-primary-500)] px-1.5 py-0.5 rounded">{c.interviewTime}</span>}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 truncate pr-1">{c.position}</p>
                            </div>
                          )
                        })}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default CalendarView;