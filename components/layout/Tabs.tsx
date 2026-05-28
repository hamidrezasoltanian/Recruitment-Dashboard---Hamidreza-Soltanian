import React from 'react';
import { View } from '../../types';

interface TabsProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeView, setActiveView }) => {
  const tabs: { id: View; label: string }[] = [
    { id: 'dashboard', label: 'داشبورد' },
    { id: 'reports', label: 'گزارش‌ها' },
    { id: 'tests', label: 'آزمون‌ها' },
    { id: 'calendar', label: 'تقویم' },
    { id: 'archive', label: 'آرشیو' },
  ];

  const baseClasses = 'whitespace-nowrap py-2.5 px-3 sm:py-3 sm:px-5 border-b-2 font-semibold text-xs sm:text-sm transition-all duration-200 flex-shrink-0';
  const activeClasses = 'border-[var(--color-primary-500)] text-[var(--color-primary-600)] bg-[var(--color-primary-50)]/50';
  const inactiveClasses = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200';

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <nav
        className="-mb-px flex overflow-x-auto scrollbar-hide px-2 sm:px-4 lg:px-6"
        aria-label="Tabs"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`${baseClasses} ${activeView === tab.id ? activeClasses : inactiveClasses}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;
