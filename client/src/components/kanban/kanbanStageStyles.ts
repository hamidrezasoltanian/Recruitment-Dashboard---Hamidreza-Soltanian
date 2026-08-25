import { Candidate } from '../../types';

export interface StageStyle {
  bar: string;
  badge: string;
  dropBg: string;
  headerText: string;
  headerBg: string;
  minimap: string;
  minimapActive: string;
}

export const getStageStyle = (title: string, id?: string): StageStyle => {
  if (id === 'inbox' || title.includes('ورودی') || title.includes('جدید') || title.includes('inbox'))
    return {
      bar: 'bg-sky-400',
      badge: 'bg-sky-100 text-sky-700',
      dropBg: 'bg-sky-50/70',
      headerText: 'text-sky-800',
      headerBg: 'bg-sky-50/95',
      minimap: 'bg-sky-200 hover:bg-sky-300',
      minimapActive: 'bg-sky-500 ring-2 ring-sky-300',
    };
  if (id === 'review' || title.includes('بررسی') || title.includes('رزومه'))
    return {
      bar: 'bg-amber-400',
      badge: 'bg-amber-100 text-amber-700',
      dropBg: 'bg-amber-50/70',
      headerText: 'text-amber-800',
      headerBg: 'bg-amber-50/95',
      minimap: 'bg-amber-200 hover:bg-amber-300',
      minimapActive: 'bg-amber-500 ring-2 ring-amber-300',
    };
  if (title.includes('مصاحبه اول') || title.includes('اول'))
    return {
      bar: 'bg-violet-400',
      badge: 'bg-violet-100 text-violet-700',
      dropBg: 'bg-violet-50/70',
      headerText: 'text-violet-800',
      headerBg: 'bg-violet-50/95',
      minimap: 'bg-violet-200 hover:bg-violet-300',
      minimapActive: 'bg-violet-500 ring-2 ring-violet-300',
    };
  if (title.includes('مصاحبه دوم') || title.includes('دوم'))
    return {
      bar: 'bg-indigo-400',
      badge: 'bg-indigo-100 text-indigo-700',
      dropBg: 'bg-indigo-50/70',
      headerText: 'text-indigo-800',
      headerBg: 'bg-indigo-50/95',
      minimap: 'bg-indigo-200 hover:bg-indigo-300',
      minimapActive: 'bg-indigo-500 ring-2 ring-indigo-300',
    };
  if (id === 'test' || title.includes('آزمون') || title.includes('تست'))
    return {
      bar: 'bg-orange-400',
      badge: 'bg-orange-100 text-orange-700',
      dropBg: 'bg-orange-50/70',
      headerText: 'text-orange-800',
      headerBg: 'bg-orange-50/95',
      minimap: 'bg-orange-200 hover:bg-orange-300',
      minimapActive: 'bg-orange-500 ring-2 ring-orange-300',
    };
  if (id === 'hired' || title.includes('استخدام') || title.includes('پذیرش') || title.includes('hired'))
    return {
      bar: 'bg-emerald-400',
      badge: 'bg-emerald-100 text-emerald-700',
      dropBg: 'bg-emerald-50/70',
      headerText: 'text-emerald-800',
      headerBg: 'bg-emerald-50/95',
      minimap: 'bg-emerald-200 hover:bg-emerald-300',
      minimapActive: 'bg-emerald-500 ring-2 ring-emerald-300',
    };
  if (id === 'rejected' || title.includes('رد') || title.includes('rejected'))
    return {
      bar: 'bg-red-400',
      badge: 'bg-red-100 text-red-700',
      dropBg: 'bg-red-50/70',
      headerText: 'text-red-800',
      headerBg: 'bg-red-50/95',
      minimap: 'bg-red-200 hover:bg-red-300',
      minimapActive: 'bg-red-500 ring-2 ring-red-300',
    };
  return {
    bar: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600',
    dropBg: 'bg-slate-50/70',
    headerText: 'text-slate-700',
    headerBg: 'bg-slate-50/95',
    minimap: 'bg-slate-200 hover:bg-slate-300',
    minimapActive: 'bg-slate-500 ring-2 ring-slate-300',
  };
};

export const filterCandidatesInColumn = (candidates: Candidate[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return candidates;
  return candidates.filter((c) => {
    const haystack = [c.name, c.position, c.email, c.phone].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });
};
