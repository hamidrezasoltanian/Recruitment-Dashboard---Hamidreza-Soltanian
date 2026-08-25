import React, { useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { StageId, Candidate } from '../../types';
import KanbanCard from './KanbanCard';
import { filterCandidatesInColumn, getStageStyle } from './kanbanStageStyles';

interface KanbanColumnProps {
  id: StageId;
  title: string;
  candidates: Candidate[];
  onViewDetails: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  candidates,
  onViewDetails,
  onEdit,
  collapsed = false,
  onToggleCollapse,
  dragHandleProps,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const style = getStageStyle(title, id);

  const filteredCandidates = useMemo(
    () => filterCandidatesInColumn(candidates, searchQuery),
    [candidates, searchQuery]
  );

  const virtualizer = useVirtualizer({
    count: filteredCandidates.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 196,
    overscan: 4,
    enabled: !collapsed && filteredCandidates.length > 0,
  });

  if (collapsed) {
    return (
      <div data-stage-id={id} className="w-12 flex-shrink-0 h-full">
        <button
          type="button"
          onClick={onToggleCollapse}
          title={`باز کردن ${title} (${candidates.length})`}
          className={`w-full h-full rounded-2xl border border-slate-200/80 flex flex-col items-center py-3 gap-2 transition-all hover:shadow-md ${style.headerBg}`}
        >
          <div className={`w-full h-1.5 ${style.bar}`} />
          <span className={`text-[10px] font-extrabold ${style.headerText} [writing-mode:vertical-rl] rotate-180 truncate max-h-[calc(100%-3rem)]`}>
            {title}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${style.badge}`}>
            {candidates.length}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div data-stage-id={id} className="w-[300px] flex-shrink-0 h-full">
      <div
        className={`rounded-2xl overflow-hidden flex flex-col h-full max-h-full transition-all duration-200 border border-slate-200/80 ${
          isOver ? 'ring-2 ring-[var(--color-primary-300)] shadow-md' : ''
        }`}
        style={{ background: 'var(--surface-muted)', boxShadow: 'var(--shadow-soft)' }}
      >
        <div className="sticky top-0 z-10 shrink-0">
          <div className={`h-1.5 w-full ${style.bar}`} />

          <div className={`px-3 py-2.5 border-b border-slate-100/80 shadow-sm backdrop-blur-sm ${style.headerBg}`}>
            <div className="flex items-center gap-1.5 mb-2">
              {dragHandleProps && (
                <button
                  type="button"
                  {...dragHandleProps}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-white/60 cursor-grab active:cursor-grabbing shrink-0"
                  title="جابجایی ستون"
                  aria-label="جابجایی ستون"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                  </svg>
                </button>
              )}

              <h2 className={`font-extrabold text-sm truncate min-w-0 flex-1 ${style.headerText}`} title={title}>
                {title}
              </h2>

              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${style.badge}`}>
                {searchQuery ? `${filteredCandidates.length}/${candidates.length}` : candidates.length}
              </span>

              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-white/60 shrink-0"
                title="جمع کردن ستون"
                aria-label="جمع کردن ستون"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>

            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در ستون..."
                className="w-full text-xs rounded-lg border border-slate-200/80 bg-white/80 pr-8 pl-2.5 py-1.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-200)]"
              />
            </div>
          </div>
        </div>

        <div
          ref={(node) => {
            setNodeRef(node);
            (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          className={`kanban-cards flex-1 min-h-0 overflow-y-auto p-3 transition-colors duration-200 ${isOver ? style.dropBg : ''}`}
        >
          {filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 text-slate-300 text-xs gap-2 border border-dashed border-slate-200 rounded-xl mx-0.5">
              {searchQuery ? (
                <span>نتیجه‌ای برای «{searchQuery}» پیدا نشد</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  بکشید و رها کنید
                </>
              )}
            </div>
          ) : (
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const candidate = filteredCandidates[virtualRow.index];
                return (
                  <div
                    key={candidate.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <KanbanCard candidate={candidate} onViewDetails={onViewDetails} onEdit={onEdit} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;
