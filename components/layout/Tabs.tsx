import React from 'react';
import { View } from '../../types';

interface TabsProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeView, setActiveView }) => {
  const tabs: { id: View; label: string }[] = [
    { id: 'dashboard', label: 'داشبورد' },
    { id: 'tests', label: 'آزمون‌ها' },
    { id: 'calendar', label: 'تقویم' },
    { id: 'archive', label: 'آرشیو' },
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-3 pb-0 bg-white border-b border-gray-100 shadow-sm">
      <nav className="flex gap-1" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`relative whitespace-nowrap py-2.5 px-4 text-sm font-semibold rounded-t-lg transition-all duration-200 ${
              activeView === tab.id
                ? 'text-[var(--color-primary-600)] bg-[var(--color-primary-50)]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {activeView === tab.id && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 rounded-t-full" style={{background:'var(--color-primary-500)'}}></span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;