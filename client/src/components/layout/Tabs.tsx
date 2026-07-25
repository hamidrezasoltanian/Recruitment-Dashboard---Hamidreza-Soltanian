import React from 'react';
import { View } from '../../types';

interface TabsProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  tests: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  archive: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
};

const Tabs: React.FC<TabsProps> = ({ activeView, setActiveView }) => {
  const tabs: { id: View; label: string }[] = [
    { id: 'dashboard', label: 'داشبورد' },
    { id: 'tests', label: 'آزمون‌ها' },
    { id: 'calendar', label: 'تقویم' },
    { id: 'archive', label: 'آرشیو' },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 sticky top-[57px] z-20">
      <nav className="flex gap-1.5 py-2" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap py-2.5 px-4 text-sm font-semibold transition-all duration-200 rounded-xl
                ${isActive
                  ? 'text-[var(--color-primary-700)] bg-[var(--color-primary-50)] shadow-sm ring-1 ring-[var(--color-primary-100)]'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              {TAB_ICONS[tab.id]}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Tabs;
