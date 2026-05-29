import React, { useState } from 'react';
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
    className={`p-2 rounded-lg transition-all ${active ? 'bg-white shadow-sm text-[var(--color-primary-600)]' : 'text-gray-500 hover:text-gray-700'}`}
  >
    {children}
  </button>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
  </svg>
);

const KanbanControls: React.FC<KanbanControlsProps> = ({ filters, onFilterChange, sortBy, onSortChange, viewMode, onViewModeChange }) => {
  const { sources, companyProfile } = useSettings();
  const jobPositions = companyProfile.jobPositions;
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = filters.search || filters.position || filters.source || sortBy !== 'createdAt';

  const selectClass = 'w-full border border-gray-200 bg-gray-50 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:bg-white transition-all';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 sm:mb-6">
      {/* Always-visible bar */}
      <div className="flex items-center gap-2 p-3 sm:p-4">
        {/* Search */}
        <input
          type="text"
          placeholder="جستجو (نام، ایمیل، موبایل)..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="flex-1 border border-gray-200 bg-gray-50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:bg-white transition-all text-sm"
        />

        {/* Filter toggle (mobile only) */}
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`sm:hidden flex items-center gap-1 p-2 rounded-lg border transition-colors ${filtersOpen || hasActiveFilters ? 'bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
          title="فیلترها"
        >
          <FilterIcon />
          {hasActiveFilters && <span className="w-2 h-2 bg-amber-400 rounded-full absolute mt-[-8px] ml-[-8px]" />}
        </button>

        {/* Desktop filters inline */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <select value={filters.position} onChange={(e) => onFilterChange({ position: e.target.value })} className={selectClass} style={{ minWidth: 130 }}>
            <option value="">همه موقعیت‌ها</option>
            {jobPositions.map(job => <option key={job.id} value={job.title}>{job.title}</option>)}
          </select>
          <select value={filters.source} onChange={(e) => onFilterChange({ source: e.target.value })} className={selectClass} style={{ minWidth: 110 }}>
            <option value="">همه منابع</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className={selectClass} style={{ minWidth: 110 }}>
            <option value="createdAt">جدیدترین</option>
            <option value="name">نام (الفبا)</option>
            <option value="rating">بیشترین امتیاز</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0">
          <ViewModeButton active={viewMode === 'kanban'} onClick={() => onViewModeChange('kanban')} title="نمای کانبان">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </ViewModeButton>
          <ViewModeButton active={viewMode === 'list'} onClick={() => onViewModeChange('list')} title="نمای لیست">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </ViewModeButton>
          <ViewModeButton active={viewMode === 'table'} onClick={() => onViewModeChange('table')} title="نمای جدول">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
          </ViewModeButton>
        </div>
      </div>

      {/* Mobile expandable filters */}
      {filtersOpen && (
        <div className="sm:hidden border-t border-gray-100 p-3 grid grid-cols-1 gap-2.5">
          <select value={filters.position} onChange={(e) => onFilterChange({ position: e.target.value })} className={selectClass}>
            <option value="">همه موقعیت‌ها</option>
            {jobPositions.map(job => <option key={job.id} value={job.title}>{job.title}</option>)}
          </select>
          <select value={filters.source} onChange={(e) => onFilterChange({ source: e.target.value })} className={selectClass}>
            <option value="">همه منابع</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className={selectClass}>
            <option value="createdAt">مرتب‌سازی: جدیدترین</option>
            <option value="name">مرتب‌سازی: نام (الفبا)</option>
            <option value="rating">مرتب‌سازی: بیشترین امتیاز</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default KanbanControls;
