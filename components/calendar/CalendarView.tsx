
import React, { useState, useMemo } from 'react';
import { useCandidates } from '../../contexts/CandidatesContext';
import { Candidate } from '../../types';

// Let TypeScript know about the global persianDate object
declare const persianDate: any;

interface CalendarViewProps {
  onViewDetails: (candidate: Candidate) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onViewDetails }) => {
  const { candidates } = useCandidates();
  const [currentDate, setCurrentDate] = useState(() => new persianDate());

  const candidatesWithInterview = useMemo(() => 
    candidates.filter(c => c.stage === 'interview' && c.interviewDate),
    [candidates]
  );

  const monthData = useMemo(() => {
    const month = currentDate.month();
    const year = currentDate.year();
    const firstDay = new persianDate([year, month, 1]);
    const lastDay = new persianDate([year, month]).daysInMonth();
    const firstDayOfWeek = firstDay.day(); // 0:Shanbeh, ..., 6:Jomeh
    
    const days = Array.from({ length: lastDay }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

    return { year, month, days, blanks };
  }, [currentDate]);

  const changeMonth = (amount: number) => {
    setCurrentDate(currentDate.clone().add('months', amount));
  };
  
  const getCandidatesForDay = (day: number) => {
      const dateStr = `${monthData.year}/${String(monthData.month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      return candidatesWithInterview.filter(c => c.interviewDate === dateStr);
  };

  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <h2 className="text-xl font-bold text-gray-800">{currentDate.format('MMMM YYYY')}</h2>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map(day => <div key={day} className="font-bold text-gray-600 p-2">{day}</div>)}
        {monthData.blanks.map(blank => <div key={`blank-${blank}`} className="border rounded-md border-gray-100"></div>)}
        {monthData.days.map(day => {
            const dayCandidates = getCandidatesForDay(day);
            const isToday = new persianDate().format('YYYY/MM/DD') === `${monthData.year}/${String(monthData.month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
            return (
                <div key={day} className="border rounded-md border-gray-200 bg-gray-50 p-2 min-h-[120px] flex flex-col">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${isToday ? 'bg-indigo-600 text-white font-bold' : ''}`}>{day}</span>
                    <div className="flex-grow mt-1 space-y-1 overflow-y-auto">
                        {dayCandidates.map(c => (
                            <div key={c.id} onClick={() => onViewDetails(c)} className="bg-blue-100 text-blue-800 text-xs p-1 rounded-md cursor-pointer hover:bg-blue-200 truncate">
                                {c.name}
                            </div>
                        ))}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default CalendarView;
