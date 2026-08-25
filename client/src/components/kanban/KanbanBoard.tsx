import React, { useCallback, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useSettings } from '../../contexts/SettingsContext';
import { Candidate, StageId, StageChangeInfo, KanbanStage } from '../../types';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import KanbanMinimap from './KanbanMinimap';

const COLLAPSED_STAGES_KEY = 'kanbanCollapsedStages';

interface KanbanBoardProps {
  candidates: Candidate[];
  onViewDetails: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
  onStageChangeRequest: (info: StageChangeInfo) => void;
}

interface SortableKanbanColumnProps {
  stage: KanbanStage;
  children: (dragHandleProps: React.HTMLAttributes<HTMLButtonElement>) => React.ReactNode;
}

const SortableKanbanColumn: React.FC<SortableKanbanColumnProps> = ({
  stage,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    data: { type: 'column' },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  const dragHandleProps: React.HTMLAttributes<HTMLButtonElement> = {
    ...attributes,
    ...listeners,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`h-full ${isDragging ? 'opacity-50' : ''}`}
    >
      {children(dragHandleProps)}
    </div>
  );
};

const loadCollapsedStages = (): Set<StageId> => {
  try {
    const saved = localStorage.getItem(COLLAPSED_STAGES_KEY);
    if (!saved) return new Set();
    const parsed = JSON.parse(saved) as StageId[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  candidates,
  onViewDetails,
  onEdit,
  onStageChangeRequest,
}) => {
  const { stages, setStageOrder } = useSettings();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<Set<StageId>>(loadCollapsedStages);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  const kanbanStages = stages.filter((s) => s.id !== 'archived');

  const toggleCollapse = useCallback((stageId: StageId) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      localStorage.setItem(COLLAPSED_STAGES_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (active.data.current?.type === 'column' && over.data.current?.type === 'column') {
      if (activeId !== overId) {
        const oldIndex = kanbanStages.findIndex((s) => s.id === activeId);
        const newIndex = kanbanStages.findIndex((s) => s.id === overId);
        const reorderedStages = arrayMove(kanbanStages, oldIndex, newIndex);
        setStageOrder(reorderedStages);
      }
      return;
    }

    const candidate = active.data.current?.candidate as Candidate | undefined;
    const newStageId = over.id as StageId;
    const newStage = stages.find((s) => s.id === newStageId);

    if (candidate && newStage && candidate.stage !== newStageId) {
      onStageChangeRequest({ candidate, newStage });
    }
  };

  const candidatesByStage = kanbanStages.reduce((acc, stage) => {
    acc[stage.id] = candidates.filter((c) => c.stage === stage.id);
    return acc;
  }, {} as Record<StageId, Candidate[]>);

  const counts = kanbanStages.reduce((acc, stage) => {
    acc[stage.id] = candidatesByStage[stage.id]?.length || 0;
    return acc;
  }, {} as Record<StageId, number>);

  const activeCandidate =
    activeId && activeId.startsWith('cand_') ? candidates.find((c) => c.id === activeId) : null;
  const activeStage =
    activeId && !activeId.startsWith('cand_') ? kanbanStages.find((s) => s.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <KanbanMinimap
        stages={kanbanStages}
        counts={counts}
        collapsedStages={collapsedStages}
        scrollContainerRef={scrollContainerRef}
      />

      <div ref={scrollContainerRef} className="pb-4 overflow-x-auto kanban-scroll-container">
        <div className="flex gap-4 min-w-max h-[calc(100vh-20rem)] min-h-[360px]">
          <SortableContext items={kanbanStages} strategy={horizontalListSortingStrategy}>
            {kanbanStages.map((stage) => (
              <SortableKanbanColumn key={stage.id} stage={stage}>
                {(dragHandleProps) => (
                  <KanbanColumn
                    id={stage.id}
                    title={stage.title}
                    candidates={candidatesByStage[stage.id] || []}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    collapsed={collapsedStages.has(stage.id)}
                    onToggleCollapse={() => toggleCollapse(stage.id)}
                    dragHandleProps={collapsedStages.has(stage.id) ? undefined : dragHandleProps}
                  />
                )}
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
