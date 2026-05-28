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

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, candidates, onViewDetails, onEdit }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="w-[300px] flex-shrink-0">
      <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 h-full flex flex-col overflow-hidden shadow-sm">
        {/* Column header */}
        <div className="flex justify-between items-center px-4 py-3 bg-white/70 border-b border-gray-200/60">
          <h2 className="font-bold text-gray-700 text-sm">{title}</h2>
          <span className="bg-[var(--color-primary-100)] text-[var(--color-primary-700)] font-bold text-xs px-2.5 py-1 rounded-full">
            {candidates.length}
          </span>
        </div>
        {/* Drop zone */}
        <div
          ref={setNodeRef}
          className={[
            'kanban-cards flex-grow overflow-y-auto p-3 transition-colors duration-150 min-h-[180px]',
            isOver ? 'bg-[var(--color-primary-50)]' : '',
          ].join(' ')}
        >
          {candidates.map((candidate) => (
            <KanbanCard key={candidate.id} candidate={candidate} onViewDetails={onViewDetails} onEdit={onEdit} />
          ))}
          {candidates.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 text-gray-300 text-xs gap-1 mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              خالی
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;
