import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

export type BoardLayout = 'kanban' | 'table' | 'list';

interface KanbanControlsProps {
  filters: { search: string; position: string; source: string; };
  onFilterChange: (newFilters: Partial<{ search: string; position: string; source: string; }>) => void;
  sortBy: string;
  onSortChange: (newSortBy: string) => void;
  layout: BoardLayout;
  onLayoutChange: (layout: BoardLayout) => void;
}

const LAYOUTS: { id: BoardLayout; label: string; icon: React.ReactNode }[] = [
  {
    id: 'kanban',
    label: 'کانبان',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    id: 'table',
    label: 'جدول',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
      </svg>
    ),
  },
  {
    id: 'list',
    label: 'لیست',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
];

const KanbanControls: React.FC<KanbanControlsProps> = ({
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  layout,
  onLayoutChange,
}) => {
  const { sources, companyProfile } = useSettings();
  const jobPositions = companyProfile.jobPositions;

  return (
    <div className="app-surface bg-white/85 backdrop-blur-sm p-4 mb-6 space-y-3 fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {LAYOUTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onLayoutChange(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                layout === item.id
                  ? 'bg-white text-[var(--color-primary-700)] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          کانبان برای حرکت مرحله‌ای · جدول برای مقایسه · لیست برای مرور سریع
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
        <div className="relative">
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="جستجوی نام..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="app-input pr-9"
          />
        </div>
        <select
          value={filters.position}
          onChange={(e) => onFilterChange({ position: e.target.value })}
          className="app-input"
        >
          <option value="">همه موقعیت‌ها</option>
          {jobPositions.map(job => <option key={job.id} value={job.title}>{job.title}</option>)}
        </select>
        <select
          value={filters.source}
          onChange={(e) => onFilterChange({ source: e.target.value })}
          className="app-input"
        >
          <option value="">همه منابع</option>
          {sources.map(source => <option key={source} value={source}>{source}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="app-input"
        >
          <option value="createdAt">جدیدترین</option>
          <option value="name">نام (الفبا)</option>
          <option value="rating">بیشترین امتیاز ستاره</option>
        </select>
      </div>
    </div>
  );
};

export default KanbanControls;
