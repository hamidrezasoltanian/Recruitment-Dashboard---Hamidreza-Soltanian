import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Candidate } from '../../types';
import StarRating from '../ui/StarRating';
import { getJobColor } from '../../utils/colorUtils';
import { WhatsappIcon } from '../ui/Icons';
import moment from 'moment-jalaali';

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

const KanbanCard: React.FC<KanbanCardProps> = ({ candidate, onViewDetails, onEdit }) => {
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
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3 touch-none cursor-pointer
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${isDragging ? 'opacity-40 shadow-xl scale-95' : ''}`}
    >
      {/* Avatar + Name row */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 text-sm truncate">{candidate.name}</h3>
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
      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 mb-2">
        <a href={`mailto:${candidate.email}`} data-action="email" className="hover:text-[var(--color-primary-600)] truncate max-w-[140px]">
          {candidate.email}
        </a>
        {candidate.phone && (
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" data-action="whatsapp" className="text-green-500 hover:text-green-600 flex-shrink-0 mr-2">
            <WhatsappIcon className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Bottom: Rating + Interview date */}
      <div className="flex items-center justify-between">
        {candidate.rating > 0
          ? <StarRating rating={candidate.rating} readOnly />
          : <span />
        }
        {formattedInterviewDate && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
            📅 {formattedInterviewDate}
          </span>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
