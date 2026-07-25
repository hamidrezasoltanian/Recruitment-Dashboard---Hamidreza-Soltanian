import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Candidate } from '../../types';
import StarRating from '../ui/StarRating';
import { getJobColor } from '../../utils/colorUtils';
import { WhatsappIcon } from '../ui/Icons';
import moment from 'moment-jalaali';
import { useSettings } from '../../contexts/SettingsContext';

declare const persianDate: any;

interface KanbanCardProps {
  candidate: Candidate;
  onViewDetails: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
}

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600',
  'from-violet-400 to-violet-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-600',
  'from-teal-400 to-teal-600',
  'from-indigo-400 to-indigo-600',
  'from-cyan-400 to-cyan-600',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatWhatsAppNumber = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) return '98' + cleaned.substring(1);
  if (cleaned.startsWith('98')) return cleaned;
  if (cleaned.length === 10) return '98' + cleaned;
  return cleaned;
};

const statusClasses: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  passed: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  review: 'bg-blue-50 text-blue-700 border-blue-200',
};

const statusText: Record<string, string> = {
  pending: 'در انتظار',
  passed: 'قبول',
  failed: 'مردود',
  review: 'نیاز به بررسی',
};

const KanbanCard: React.FC<KanbanCardProps> = ({ candidate, onViewDetails, onEdit }) => {
  const { testLibrary } = useSettings();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
    data: { candidate },
  });

  const jobColor = getJobColor(candidate.position);
  const avatarColor = getAvatarColor(candidate.name);
  const initials = candidate.name.trim().charAt(0);
  const whatsappNumber = formatWhatsAppNumber(candidate.phone || '');
  const hasTestResult = candidate.testResults && candidate.testResults.some((r: any) => r.file);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, borderRight: `4px solid ${jobColor}` }
    : { borderRight: `4px solid ${jobColor}` };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const actionElement = (e.target as HTMLElement).closest('[data-action]');
    const action = actionElement?.getAttribute('data-action');
    if (action === 'email' || action === 'whatsapp' || action === 'edit') {
      e.stopPropagation();
      if (action === 'edit') onEdit(candidate);
      return;
    }
    onViewDetails(candidate);
  };

  const getFormattedInterviewDate = () => {
    if (!candidate.interviewDate) return '';
    try {
      const parts = candidate.interviewDate.split('/');
      if (parts.length === 3) {
        const gregorianDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const m = moment(gregorianDate);
        const persianMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
        const pDay = (m as any).jDate();
        const pMonth = (m as any).jMonth();
        const dateStr = `${pDay} ${persianMonths[pMonth]}`;
        return candidate.interviewTime ? `${dateStr}، ${candidate.interviewTime}` : dateStr;
      }
      const date = new Date(candidate.interviewDate);
      const dateStr = date.toLocaleDateString('fa-IR');
      return candidate.interviewTime ? `${dateStr}، ${candidate.interviewTime}` : dateStr;
    } catch { return candidate.interviewDate; }
  };

  const formattedInterviewDate = getFormattedInterviewDate();

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`bg-white rounded-xl border border-slate-100/90 p-3.5 mb-3 touch-none cursor-pointer
        transition-all duration-200 hover:-translate-y-0.5
        ${isDragging ? 'opacity-40 scale-95' : ''}`}
      style={{
        ...style,
        boxShadow: isDragging ? 'var(--shadow-lift)' : 'var(--shadow-soft)',
      }}
    >
      {/* Avatar + Name row */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 text-sm truncate">{candidate.name}</h3>
          <p className="text-xs font-medium text-[var(--color-primary-600)] truncate">{candidate.position || 'بدون موقعیت'}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {candidate.interviewTimeChanged && (
            <span title="زمان مصاحبه تغییر کرده" className="text-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
              </svg>
            </span>
          )}
          {hasTestResult && (
            <span title="آزمون دارد" className="text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h2a1 1 0 100-2H7zm3 0a1 1 0 000 2h2a1 1 0 100-2h-2z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          <button
            data-action="edit"
            className="text-gray-300 hover:text-[var(--color-primary-500)] transition-colors"
            aria-label={`ویرایش ${candidate.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contact row */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50/90 rounded-lg px-2.5 py-1.5 mb-2.5 border border-slate-100">
        <a href={`mailto:${candidate.email}`} data-action="email" className="hover:text-[var(--color-primary-600)] truncate max-w-[140px]">
          {candidate.email}
        </a>
        {candidate.phone && (
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" data-action="whatsapp" className="text-emerald-500 hover:text-emerald-600 flex-shrink-0 mr-2">
            <WhatsappIcon className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Test results badges */}
      {candidate.testResults && candidate.testResults.some((tr: any) => tr.status !== 'not_sent') && (
        <div className="flex flex-wrap gap-1 mt-1 mb-2">
          {candidate.testResults.map((tr: any) => {
            const testItem = testLibrary.find((t: any) => t.id === tr.testId);
            if (!testItem || tr.status === 'not_sent') return null;
            return (
              <span 
                key={tr.testId} 
                className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${statusClasses[tr.status] || ''}`}
                title={`${testItem.name}: ${statusText[tr.status]}`}
              >
                <span>{testItem.name}</span>
                <span>({statusText[tr.status]})</span>
                {tr.file && <span title="دارای فایل پاسخ">📄</span>}
              </span>
            );
          })}
        </div>
      )}

      {/* Bottom: Rating + Interview date + Interviewer */}
      <div className="flex items-center justify-between">
        {candidate.rating > 0
          ? <StarRating rating={candidate.rating} readOnly />
          : <span />
        }
        <div className="flex flex-col items-end gap-1">
          {formattedInterviewDate && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg flex-shrink-0 inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedInterviewDate}
            </span>
          )}
          {candidate.interviewer && (
            <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg flex-shrink-0 inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {candidate.interviewer}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
