import React, { useCallback, useEffect, useState } from 'react';
import { KanbanStage, StageId } from '../../types';
import { getStageStyle } from './kanbanStageStyles';

interface KanbanMinimapProps {
  stages: KanbanStage[];
  counts: Record<StageId, number>;
  collapsedStages: Set<StageId>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const KanbanMinimap: React.FC<KanbanMinimapProps> = ({
  stages,
  counts,
  collapsedStages,
  scrollContainerRef,
}) => {
  const [activeStageId, setActiveStageId] = useState<StageId | null>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0, visible: false });

  const updateThumb = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    if (scrollWidth <= clientWidth) {
      setThumb({ left: 0, width: 0, visible: false });
      return;
    }

    const width = Math.max((clientWidth / scrollWidth) * 100, 8);
    const maxLeft = 100 - width;
    const left = (scrollLeft / (scrollWidth - clientWidth)) * maxLeft;
    setThumb({ left, width, visible: true });
  }, [scrollContainerRef]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      updateThumb();

      const columns = container.querySelectorAll('[data-stage-id]');
      let closestId: StageId | null = null;
      let closestDistance = Infinity;
      const containerLeft = container.getBoundingClientRect().left + 24;

      columns.forEach((col) => {
        const rect = col.getBoundingClientRect();
        const distance = Math.abs(rect.left - containerLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = col.getAttribute('data-stage-id') as StageId;
        }
      });

      if (closestId) setActiveStageId(closestId);
    };

    onScroll();
    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [scrollContainerRef, updateThumb, stages]);

  const scrollToStage = (stageId: StageId) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const column = container.querySelector(`[data-stage-id="${stageId}"]`);
    if (column) {
      column.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      setActiveStageId(stageId);
    }
  };

  if (stages.length === 0) return null;

  return (
    <div className="mb-3 rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-sm px-3 py-2.5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">نقشه ستون‌ها</span>
        {thumb.visible && (
          <span className="text-[10px] text-slate-400">برای حرکت بین ستون‌ها کلیک کنید یا اسکرول کنید</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {stages.map((stage) => {
          const style = getStageStyle(stage.title, stage.id);
          const isActive = activeStageId === stage.id;
          const isCollapsed = collapsedStages.has(stage.id);
          const count = counts[stage.id] || 0;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => scrollToStage(stage.id)}
              title={`${stage.title} (${count})`}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all duration-200 text-slate-700 ${
                isActive ? style.minimapActive + ' text-white shadow-sm' : style.minimap
              } ${isCollapsed ? 'opacity-60' : ''}`}
            >
              <span className="truncate max-w-[120px] inline-block align-middle">{stage.title}</span>
              <span className="ml-1 opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {thumb.visible && (
        <div className="relative mt-2.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="absolute top-0 h-full rounded-full bg-slate-400/70 transition-all duration-150"
            style={{ left: `${thumb.left}%`, width: `${thumb.width}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default KanbanMinimap;
