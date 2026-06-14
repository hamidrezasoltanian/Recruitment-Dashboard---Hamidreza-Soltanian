import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { StageId, Candidate } from '../../types';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  id: StageId;
  title: string;
  candidates: Candidate[];
  onViewDetails: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
}

const STAGE_COLORS: Record<string, { bar: string; badge: string; badgeText: string; bg: string }> = {
  'inbox':       { bar: 'bg-sky-400',    badge: 'bg-sky-100',    badgeText: 'text-sky-700',    bg: 'bg-sky-50/60' },
  'review':      { bar: 'bg-amber-400',  badge: 'bg-amber-100',  badgeText: 'text-amber-700',  bg: 'bg-amber-50/60' },
  'interview-1': { bar: 'bg-violet-500', badge: 'bg-violet-100', badgeText: 'text-violet-700', bg: 'bg-violet-50/60' },
  'interview-2': { bar: 'bg-indigo-500', badge: 'bg-indigo-100', badgeText: 'text-indigo-700', bg: 'bg-indigo-50/60' },
  'test':        { bar: 'bg-orange-500', badge: 'bg-orange-100', badgeText: 'text-orange-700', bg: 'bg-orange-50/60' },
  'hired':       { bar: 'bg-emerald-500',badge: 'bg-emerald-100',badgeText: 'text-emerald-700',bg: 'bg-emerald-50/60' },
  'rejected':    { bar: 'bg-red-400',    badge: 'bg-red-100',    badgeText: 'text-red-700',    bg: 'bg-red-50/60' },
};

const DEFAULT_STAGE_COLOR = { bar: 'bg-gray-400', badge: 'bg-gray-100', badgeText: 'text-gray-700', bg: 'bg-gray-100/60' };

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, candidates, onViewDetails, onEdit }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const colors = STAGE_COLORS[id] || DEFAULT_STAGE_COLOR;

  return (
    <div className="w-[300px] flex-shrink-0">
      <div className={`${colors.bg} backdrop-blur-sm rounded-2xl overflow-hidden h-full flex flex-col shadow-sm border border-white/60`}>
        {/* Colored top bar */}
        <div className={`h-1.5 w-full ${colors.bar}`}></div>
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700 text-sm">{title}</h2>
            <span className={`${colors.badge} ${colors.badgeText} font-bold text-xs px-2.5 py-1 rounded-full`}>{candidates.length}</span>
          </div>
          <div
            ref={setNodeRef}
            className={`kanban-cards flex-grow overflow-y-auto pr-1 -mr-1 rounded-xl transition-colors duration-200 min-h-[200px] ${isOver ? 'bg-white/50 ring-2 ring-[var(--color-primary-300)] ring-offset-1' : ''}`}
          >
            {candidates.map((candidate) => (
              <KanbanCard key={candidate.id} candidate={candidate} onViewDetails={onViewDetails} onEdit={onEdit} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;
