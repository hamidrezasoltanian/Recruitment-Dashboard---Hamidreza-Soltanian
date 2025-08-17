import React from 'react';
import { 
  DndContext, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Candidate, StageId, StageChangeInfo } from '../../types';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  onAddCandidate: (stage: StageId) => void;
  onViewDetails: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
  onStageChangeRequest: (info: StageChangeInfo) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ onAddCandidate, onViewDetails, onEdit, onStageChangeRequest }) => {
  const { candidates } = useCandidates();
  const { stages } = useSettings();

  // Define sensors to distinguish clicks from drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the pointer to move by 10px before activating a drag
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // onDragEnd is only called for actual drags because of the sensor activation constraint.
    // Clicks are handled by the onClick event on the card itself.
    if (over) {
      const candidate = active.data.current?.candidate as Candidate | undefined;
      const newStageId = over.id as StageId;
      const newStage = stages.find(s => s.id === newStageId);

      if (candidate && newStage && candidate.stage !== newStageId) {
        onStageChangeRequest({ candidate, newStage });
      }
    }
  };

  const kanbanStages = stages.filter(s => s.id !== 'archived');

  const candidatesByStage = kanbanStages.reduce((acc, stage) => {
    acc[stage.id] = candidates.filter((c) => c.stage === stage.id);
    return acc;
  }, {} as Record<StageId, Candidate[]>);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="pb-4">
        <div className="flex gap-4">
          {kanbanStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              id={stage.id}
              title={stage.title}
              candidates={candidatesByStage[stage.id] || []}
              onAddCandidate={onAddCandidate}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
};

export default KanbanBoard;