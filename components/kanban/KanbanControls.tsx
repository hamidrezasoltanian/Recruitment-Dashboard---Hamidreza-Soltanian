import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { KanbanViewMode } from '../../types';

interface KanbanControlsProps {
  filters: { search: string; position: string; source: string; };
  onFilterChange: (newFilters: Partial<{ search: string; position: string; source: string; }>) => void;
  sortBy: string;
  onSortChange: (newSortBy: string) => void;
  viewMode: KanbanViewMode;
  onViewModeChange: (mode: KanbanViewMode) => void;
}

const ViewModeButton: React.FC<{ active: boolean; onClick: () => void; title: string; children: React.ReactNode }> = ({ active, onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg transition-colors ${active ? 'bg-[var(--color-primary-600)] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
  >
    {children}
  </button>
);

const KanbanControls: React.FC<KanbanControlsProps> = ({ filters, onFilterChange, sortBy, onSortChange, viewMode, onViewModeChange }) => {
  const { sources, companyProfile } = useSettings();
  const jobPositions = companyProfile.jobPositions;

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-center">
      {/* Search - now searches name, email, phone */}
      <input
        type="text"
        placeholder="جستجو (نام، ایمیل، موبایل)..."
        value={filters.search}
        onChange={(e) => onFilterChange({ search: e.target.value })}
        className="flex-1 min-w-[180px] border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm"
      />
      <select
        value={filters.position}
        onChange={(e) => onFilterChange({ position: e.target.value })}
        className="flex-1 min-w-[150px] border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 sm:text-sm"
      >
        <option value="">همه موقعیت‌ها</option>
        {jobPositions.map(job => <option key={job.id} value={job.title}>{job.title}</option>)}
      </select>
      <select
        value={filters.source}
        onChange={(e) => onFilterChange({ source: e.target.value })}
        className="flex-1 min-w-[130px] border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 sm:text-sm"
      >
        <option value="">همه منابع</option>
        {sources.map(source => <option key={source} value={source}>{source}</option>)}
      </select>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="flex-1 min-w-[130px] border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 sm:text-sm"
      >
        <option value="createdAt">جدیدترین</option>
        <option value="name">نام (الفبا)</option>
        <option value="rating">بیشترین امتیاز</option>
      </select>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
        <ViewModeButton active={viewMode === 'kanban'} onClick={() => onViewModeChange('kanban')} title="نمای کانبان">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </ViewModeButton>
        <ViewModeButton active={viewMode === 'list'} onClick={() => onViewModeChange('list')} title="نمای لیست">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </ViewModeButton>
        <ViewModeButton active={viewMode === 'table'} onClick={() => onViewModeChange('table')} title="نمای جدول">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
          </svg>
        </ViewModeButton>
      </div>
    </div>
  );
};

export default KanbanControls;
