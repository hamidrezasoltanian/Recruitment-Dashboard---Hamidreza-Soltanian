import React, { useMemo, useState } from 'react';
import { Candidate, KanbanStage } from '../../types';
import StarRating from '../ui/StarRating';
import { useSettings } from '../../contexts/SettingsContext';

interface CandidatesTableViewProps {
  candidates: Candidate[];
  onViewDetails: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
  onStageChangeRequest: (info: { candidate: Candidate; newStage: KanbanStage }) => void;
}

type SortKey = 'name' | 'position' | 'source' | 'stage' | 'rating' | 'eval' | 'createdAt' | 'interview';

const decisionLabel: Record<string, string> = {
  offer: 'Offer',
  standby: 'ذخیره',
  reject: 'رد',
};

function getEvalMeta(candidate: Candidate): { score: number | null; decision: string } {
  if (!candidate.evaluation) return { score: null, decision: '' };
  try {
    const parsed = JSON.parse(candidate.evaluation);
    return {
      score: typeof parsed.totalScore === 'number' ? parsed.totalScore : null,
      decision: parsed.answers?.finalDecision || '',
    };
  } catch {
    return { score: null, decision: '' };
  }
}

const CandidatesTableView: React.FC<CandidatesTableViewProps> = ({
  candidates,
  onViewDetails,
  onEdit,
  onStageChangeRequest,
}) => {
  const { stages } = useSettings();
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const stageMap = useMemo(() => {
    const map = new Map<string, KanbanStage>();
    stages.forEach((s) => map.set(s.id, s));
    return map;
  }, [stages]);

  const activeStages = useMemo(
    () => stages.filter((s) => s.id !== 'archived' && s.id !== 'rejected'),
    [stages]
  );

  const sorted = useMemo(() => {
    const rows = [...candidates];
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const evalA = getEvalMeta(a).score ?? -1;
      const evalB = getEvalMeta(b).score ?? -1;
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name, 'fa') * dir;
        case 'position':
          return (a.position || '').localeCompare(b.position || '', 'fa') * dir;
        case 'source':
          return (a.source || '').localeCompare(b.source || '', 'fa') * dir;
        case 'stage':
          return (stageMap.get(a.stage)?.title || a.stage).localeCompare(
            stageMap.get(b.stage)?.title || b.stage,
            'fa'
          ) * dir;
        case 'rating':
          return (a.rating - b.rating) * dir;
        case 'eval':
          return (evalA - evalB) * dir;
        case 'interview':
          return ((a.interviewDate || '').localeCompare(b.interviewDate || '')) * dir;
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
    });
    return rows;
  }, [candidates, sortKey, sortDir, stageMap]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'position' || key === 'source' || key === 'stage' ? 'asc' : 'desc');
    }
  };

  const SortHeader: React.FC<{ k: SortKey; label: string }> = ({ k, label }) => (
    <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 whitespace-nowrap">
      <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-slate-800">
        {label}
        {sortKey === k && <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
        متقاضی‌ای با این فیلترها یافت نشد.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <SortHeader k="name" label="نام" />
              <SortHeader k="position" label="پوزیشن" />
              <SortHeader k="stage" label="مرحله" />
              <SortHeader k="source" label="منبع" />
              <SortHeader k="rating" label="ستاره" />
              <SortHeader k="eval" label="ارزیابی" />
              <th className="px-3 py-3 text-right text-xs font-bold text-slate-500">رزومه</th>
              <SortHeader k="interview" label="مصاحبه" />
              <SortHeader k="createdAt" label="ورود" />
              <th className="px-3 py-3 text-right text-xs font-bold text-slate-500">تماس</th>
              <th className="px-3 py-3 text-right text-xs font-bold text-slate-500">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((c) => {
              const evalMeta = getEvalMeta(c);
              const stageTitle = stageMap.get(c.stage)?.title || c.stage;
              return (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50/80 cursor-pointer"
                  onClick={() => onViewDetails(c)}
                >
                  <td className="px-3 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{c.name}</td>
                  <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{c.position || '—'}</td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={c.stage}
                      onChange={(e) => {
                        const newStage = stages.find((s) => s.id === e.target.value);
                        if (newStage && newStage.id !== c.stage) {
                          onStageChangeRequest({ candidate: c, newStage });
                        }
                      }}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white max-w-[140px]"
                    >
                      <option value={c.stage}>{stageTitle}</option>
                      {activeStages
                        .filter((s) => s.id !== c.stage)
                        .map((s) => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      {c.stage !== 'rejected' && <option value="rejected">رد شده</option>}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{c.source || '—'}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {c.rating > 0 ? <StarRating rating={c.rating} readOnly /> : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {evalMeta.score != null ? (
                      <span className="font-bold text-indigo-700">{evalMeta.score}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                    {evalMeta.decision && (
                      <span className="mr-1 text-[10px] text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                        {decisionLabel[evalMeta.decision] || evalMeta.decision}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">
                    <span className={c.hasResume ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                      {c.hasResume ? 'دارد' : 'ندارد'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">
                    {c.interviewDate
                      ? `${c.interviewDate}${c.interviewTime ? ` ${c.interviewTime}` : ''}`
                      : '—'}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('fa-IR') : '—'}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="hover:text-[var(--color-primary-600)]">{c.phone}</a>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onViewDetails(c)}
                      className="text-[var(--color-primary-600)] hover:underline ml-3"
                    >
                      جزئیات
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      className="text-slate-500 hover:underline"
                    >
                      ویرایش
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
        {sorted.length} متقاضی
      </div>
    </div>
  );
};

export default CandidatesTableView;
