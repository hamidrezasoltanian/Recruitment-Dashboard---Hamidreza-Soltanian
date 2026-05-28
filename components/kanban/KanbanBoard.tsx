import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { useSettings } from '../../contexts/SettingsContext';
import { Candidate, StageId, StageChangeInfo, KanbanStage, KanbanViewMode } from '../../types';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import StarRating from '../ui/StarRating';

declare const persianDate: any;

interface KanbanBoardProps {
  candidates: Candidate[];
  viewMode: KanbanViewMode;
  onViewDetails: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
  onStageChangeRequest: (info: StageChangeInfo) => void;
}

const SortableKanbanColumn: React.FC<{ stage: KanbanStage; children: React.ReactNode }> = ({ stage, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    data: { type: 'column' }
  });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isDragging ? 'opacity-50' : ''}>
      {children}
    </div>
  );
};

// --- List View ---
const ListView: React.FC<{ candidates: Candidate[]; stages: KanbanStage[]; onViewDetails: (c: Candidate) => void; onEdit: (c: Candidate) => void }> = ({ candidates, stages, onViewDetails, onEdit }) => {
  const activeStages = stages.filter(s => s.id !== 'archived' && s.id !== 'hired' && s.id !== 'rejected');

  const formatDate = (isoDate: string) => {
    try { return new persianDate(new Date(isoDate)).format('D MMM YY'); } catch { return ''; }
  };

  if (candidates.filter(c => !['archived', 'hired', 'rejected'].includes(c.stage)).length === 0) {
    return <p className="text-center text-gray-400 py-12">متقاضی فعالی یافت نشد.</p>;
  }

  return (
    <div className="space-y-6">
      {activeStages.map(stage => {
        const stageCandidates = candidates.filter(c => c.stage === stage.id);
        if (stageCandidates.length === 0) return null;
        return (
          <div key={stage.id}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-bold text-gray-700">{stage.title}</h3>
              <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{stageCandidates.length}</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {stageCandidates.map(candidate => (
                <div key={candidate.id} className="list-view-row flex items-center gap-4 p-3 cursor-pointer" onClick={() => onViewDetails(candidate)}>
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {candidate.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{candidate.name}</p>
                    <p className="text-xs text-gray-500 truncate">{candidate.position} · {candidate.source}</p>
                  </div>
                  <div className="hidden sm:block text-xs text-gray-500 flex-shrink-0">{candidate.email}</div>
                  <div className="flex-shrink-0">
                    <StarRating rating={candidate.rating} readOnly />
                  </div>
                  <div className="hidden md:block text-xs text-gray-400 flex-shrink-0">{formatDate(candidate.createdAt)}</div>
                  <button
                    onClick={e => { e.stopPropagation(); onEdit(candidate); }}
                    className="text-gray-400 hover:text-[var(--color-primary-600)] flex-shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Table View ---
const TableView: React.FC<{ candidates: Candidate[]; stages: KanbanStage[]; onViewDetails: (c: Candidate) => void; onEdit: (c: Candidate) => void }> = ({ candidates, stages, onViewDetails, onEdit }) => {
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const activeCandidates = candidates.filter(c => !['archived', 'hired', 'rejected'].includes(c.stage));

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => (d === 1 ? -1 : 1));
    } else {
      setSortField(field);
      setSortDir(-1);
    }
  };

  const sorted = [...activeCandidates].sort((a, b) => {
    let va: any, vb: any;
    switch (sortField) {
      case 'name': va = a.name; vb = b.name; return va.localeCompare(vb, 'fa') * sortDir;
      case 'position': va = a.position; vb = b.position; return va.localeCompare(vb, 'fa') * sortDir;
      case 'source': va = a.source; vb = b.source; return va.localeCompare(vb, 'fa') * sortDir;
      case 'rating': return (a.rating - b.rating) * sortDir;
      case 'stage':
        va = stages.findIndex(s => s.id === a.stage);
        vb = stages.findIndex(s => s.id === b.stage);
        return (va - vb) * sortDir;
      default:
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortDir;
    }
  });

  const formatDate = (isoDate: string) => {
    try { return new persianDate(new Date(isoDate)).format('D MMM YY'); } catch { return ''; }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-300 mr-1">↕</span>;
    return <span className="mr-1">{sortDir === 1 ? '↑' : '↓'}</span>;
  };

  if (sorted.length === 0) {
    return <p className="text-center text-gray-400 py-12">متقاضی فعالی یافت نشد.</p>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full table-view">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>نام <SortIcon field="name" /></th>
            <th onClick={() => handleSort('position')}>موقعیت <SortIcon field="position" /></th>
            <th onClick={() => handleSort('stage')}>مرحله <SortIcon field="stage" /></th>
            <th onClick={() => handleSort('source')}>منبع <SortIcon field="source" /></th>
            <th onClick={() => handleSort('rating')}>امتیاز <SortIcon field="rating" /></th>
            <th onClick={() => handleSort('createdAt')}>تاریخ ثبت <SortIcon field="createdAt" /></th>
            <th>اقدام</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(candidate => {
            const stageName = stages.find(s => s.id === candidate.stage)?.title || candidate.stage;
            return (
              <tr key={candidate.id} className="cursor-pointer" onClick={() => onViewDetails(candidate)}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {candidate.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 whitespace-nowrap">{candidate.name}</p>
                      <p className="text-xs text-gray-400">{candidate.email}</p>
                    </div>
                  </div>
                </td>
                <td className="text-sm text-[var(--color-primary-600)] font-medium whitespace-nowrap">{candidate.position}</td>
                <td>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap">{stageName}</span>
                </td>
                <td className="text-sm text-gray-600 whitespace-nowrap">{candidate.source}</td>
                <td><StarRating rating={candidate.rating} readOnly /></td>
                <td className="text-sm text-gray-500 whitespace-nowrap">{formatDate(candidate.createdAt)}</td>
                <td>
                  <button
                    onClick={e => { e.stopPropagation(); onEdit(candidate); }}
                    className="text-gray-400 hover:text-[var(--color-primary-600)]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// --- Main KanbanBoard ---
const KanbanBoard: React.FC<KanbanBoardProps> = ({ candidates, viewMode, onViewDetails, onEdit, onStageChangeRequest }) => {
  const { stages, setStageOrder } = useSettings();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  const kanbanStages = stages.filter(s => s.id !== 'archived');

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (active.data.current?.type === 'column' && over.data.current?.type === 'column') {
      if (activeId !== overId) {
        const oldIndex = kanbanStages.findIndex(s => s.id === activeId);
        const newIndex = kanbanStages.findIndex(s => s.id === overId);
        setStageOrder(arrayMove(kanbanStages, oldIndex, newIndex));
      }
      return;
    }

    const candidate = active.data.current?.candidate as Candidate | undefined;
    const newStageId = over.id as StageId;
    const newStage = stages.find(s => s.id === newStageId);

    if (candidate && newStage && candidate.stage !== newStageId) {
      onStageChangeRequest({ candidate, newStage });
    }
  };

  if (viewMode === 'list') {
    return <ListView candidates={candidates} stages={kanbanStages} onViewDetails={onViewDetails} onEdit={onEdit} />;
  }

  if (viewMode === 'table') {
    return <TableView candidates={candidates} stages={kanbanStages} onViewDetails={onViewDetails} onEdit={onEdit} />;
  }

  const candidatesByStage = kanbanStages.reduce((acc, stage) => {
    acc[stage.id] = candidates.filter(c => c.stage === stage.id);
    return acc;
  }, {} as Record<StageId, Candidate[]>);

  const activeCandidate = activeId && activeId.startsWith('cand_') ? candidates.find(c => c.id === activeId) : null;
  const activeStage = activeId && !activeId.startsWith('cand_') ? kanbanStages.find(s => s.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="pb-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          <SortableContext items={kanbanStages} strategy={horizontalListSortingStrategy}>
            {kanbanStages.map(stage => (
              <SortableKanbanColumn key={stage.id} stage={stage}>
                <KanbanColumn
                  id={stage.id}
                  title={stage.title}
                  candidates={candidatesByStage[stage.id] || []}
                  onViewDetails={onViewDetails}
                  onEdit={onEdit}
                />
              </SortableKanbanColumn>
            ))}
          </SortableContext>
        </div>
      </div>
      <DragOverlay>
        {activeCandidate ? (
          <KanbanCard candidate={activeCandidate} onViewDetails={() => {}} onEdit={() => {}} />
        ) : activeStage ? (
          <KanbanColumn
            id={activeStage.id}
            title={activeStage.title}
            candidates={candidatesByStage[activeStage.id] || []}
            onViewDetails={() => {}}
            onEdit={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
