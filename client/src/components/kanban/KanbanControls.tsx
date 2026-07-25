import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

interface KanbanControlsProps {
  filters: { search: string; position: string; source: string; };
  onFilterChange: (newFilters: Partial<{ search: string; position: string; source: string; }>) => void;
  sortBy: string;
  onSortChange: (newSortBy: string) => void;
}

const KanbanControls: React.FC<KanbanControlsProps> = ({ filters, onFilterChange, sortBy, onSortChange }) => {
  const { sources, companyProfile } = useSettings();
  const jobPositions = companyProfile.jobPositions;

  return (
    <div className="app-surface bg-white/85 backdrop-blur-sm p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center fade-in">
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
        <option value="rating">بیشترین امتیاز</option>
      </select>
    </div>
  );
};

export default KanbanControls;
