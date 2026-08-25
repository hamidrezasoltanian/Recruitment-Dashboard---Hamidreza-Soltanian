import React, { useMemo } from 'react';
import { Candidate, KanbanStage } from '../../types';
import StarRating from '../ui/StarRating';
import { useSettings } from '../../contexts/SettingsContext';
import { getJobColor } from '../../utils/colorUtils';

interface CandidatesListViewProps {
  candidates: Candidate[];
  onViewDetails: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
}

function getEvalScore(candidate: Candidate): number | null {
  if (!candidate.evaluation) return null;
  try {
    const parsed = JSON.parse(candidate.evaluation);
    return typeof parsed.totalScore === 'number' ? parsed.totalScore : null;
  } catch {
    return null;
  }
}

const CandidatesListView: React.FC<CandidatesListViewProps> = ({
  candidates,
  onViewDetails,
  onEdit,
}) => {
  const { stages } = useSettings();
  const stageMap = useMemo(() => {
    const map = new Map<string, KanbanStage>();
    stages.forEach((s) => map.set(s.id, s));
    return map;
  }, [stages]);

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
        متقاضی‌ای با این فیلترها یافت نشد.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {candidates.map((c) => {
        const evalScore = getEvalScore(c);
        const stageTitle = stageMap.get(c.stage)?.title || c.stage;
        const jobColor = getJobColor(c.position);
        const activeTests = (c.testResults || []).filter((t) => t.status && t.status !== 'not_sent').length;

        return (
          <div
            key={c.id}
            onClick={() => onViewDetails(c)}
            className="bg-white rounded-xl border border-slate-200 px-4 py-3 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ borderRightWidth: 4, borderRightColor: jobColor }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-800 text-sm truncate">{c.name}</h3>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                  {stageTitle}
                </span>
                {c.hasResume ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">رزومه</span>
                ) : null}
                {activeTests > 0 && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
                    {activeTests} آزمون
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-primary-600)] font-medium truncate mb-1">
                {c.position || 'بدون موقعیت'}
                {c.source ? ` · ${c.source}` : ''}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                {c.phone && <span>{c.phone}</span>}
                {c.email && <span className="truncate max-w-[220px]">{c.email}</span>}
                {c.interviewDate && (
                  <span className="text-emerald-700 font-medium">
                    مصاحبه: {c.interviewDate}{c.interviewTime ? ` ${c.interviewTime}` : ''}
                  </span>
                )}
                {c.createdAt && (
                  <span>ورود: {new Date(c.createdAt).toLocaleDateString('fa-IR')}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
              {evalScore != null && (
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
                  {evalScore}
                </span>
              )}
              {c.rating > 0 ? <StarRating rating={c.rating} readOnly /> : null}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(c);
                }}
                className="text-xs text-slate-500 hover:text-[var(--color-primary-600)] border border-slate-200 px-2.5 py-1.5 rounded-lg"
              >
                ویرایش
              </button>
            </div>
          </div>
        );
      })}
      <div className="text-xs text-slate-500 px-1 pt-1">{candidates.length} متقاضی</div>
    </div>
  );
};

export default CandidatesListView;
