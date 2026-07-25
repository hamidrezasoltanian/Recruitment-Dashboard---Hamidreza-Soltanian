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

const getStageStyle = (title: string) => {
  if (title.includes('ورودی') || title.includes('جدید') || title.includes('inbox'))
    return { bar: 'bg-sky-400', badge: 'bg-sky-100 text-sky-700', dropBg: 'bg-sky-50/70', headerText: 'text-sky-800' };
  if (title.includes('بررسی') || title.includes('رزومه'))
    return { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700', dropBg: 'bg-amber-50/70', headerText: 'text-amber-800' };
  if (title.includes('مصاحبه اول') || title.includes('اول'))
    return { bar: 'bg-violet-400', badge: 'bg-violet-100 text-violet-700', dropBg: 'bg-violet-50/70', headerText: 'text-violet-800' };
  if (title.includes('مصاحبه دوم') || title.includes('دوم'))
    return { bar: 'bg-indigo-400', badge: 'bg-indigo-100 text-indigo-700', dropBg: 'bg-indigo-50/70', headerText: 'text-indigo-800' };
  if (title.includes('آزمون') || title.includes('تست'))
    return { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', dropBg: 'bg-orange-50/70', headerText: 'text-orange-800' };
  if (title.includes('استخدام') || title.includes('پذیرش') || title.includes('hired'))
    return { bar: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700', dropBg: 'bg-emerald-50/70', headerText: 'text-emerald-800' };
  if (title.includes('رد') || title.includes('rejected'))
    return { bar: 'bg-red-400', badge: 'bg-red-100 text-red-700', dropBg: 'bg-red-50/70', headerText: 'text-red-800' };
  return { bar: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600', dropBg: 'bg-slate-50/70', headerText: 'text-slate-700' };
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, candidates, onViewDetails, onEdit }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const style = getStageStyle(title);

  return (
    <div className="w-[300px] flex-shrink-0">
      <div
        className={`rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-200 border border-slate-200/80 ${
          isOver ? 'ring-2 ring-[var(--color-primary-300)] shadow-md' : ''
        }`}
        style={{ background: 'var(--surface-muted)', boxShadow: 'var(--shadow-soft)' }}
      >
        <div className={`h-1.5 w-full ${style.bar}`} />

        <div className="flex justify-between items-center px-4 py-3 bg-white/90 border-b border-slate-100">
          <h2 className={`font-extrabold text-sm ${style.headerText}`}>{title}</h2>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${style.badge}`}>
            {candidates.length}
          </span>
        </div>

        <div
          ref={setNodeRef}
          className={`kanban-cards flex-grow overflow-y-auto p-3 space-y-0 min-h-[200px] transition-colors duration-200 ${isOver ? style.dropBg : ''}`}
        >
          {candidates.map((candidate) => (
            <KanbanCard key={candidate.id} candidate={candidate} onViewDetails={onViewDetails} onEdit={onEdit} />
          ))}
          {candidates.length === 0 && (
            <div className="flex flex-col items-center justify-center h-28 text-slate-300 text-xs gap-2 border border-dashed border-slate-200 rounded-xl mx-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              بکشید و رها کنید
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;
