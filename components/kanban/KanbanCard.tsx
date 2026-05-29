import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Candidate } from '../../types';
import StarRating from '../ui/StarRating';
import { getJobColor } from '../../utils/colorUtils';
import { WhatsappIcon } from '../ui/Icons';
import { useSettings } from '../../contexts/SettingsContext';
import { calcCompleteness } from '../../utils/completenessUtils';
import { useComparison } from '../../contexts/ComparisonContext';

declare const persianDate: any;

interface KanbanCardProps {
  candidate: Candidate;
  onViewDetails: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
}

const getDaysInStage = (candidate: Candidate): number => {
  const since = candidate.stageEnteredAt || candidate.createdAt;
  const ms = Date.now() - new Date(since).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const KanbanCard: React.FC<KanbanCardProps> = ({ candidate, onViewDetails, onEdit }) => {
  const { slaSettings } = useSettings();
  const { toggleComparison, isInComparison } = useComparison();
  const inComparison = isInComparison(candidate.id);
  const { score: completeness } = calcCompleteness(candidate);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
    data: { candidate },
  });

  const jobColor = getJobColor(candidate.position);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    borderRight: `5px solid ${jobColor}`,
  } : { borderRight: `5px solid ${jobColor}` };

  const hasTestResult = candidate.testResults && candidate.testResults.some(r => r.file);
  const whatsappNumber = candidate.phone ? candidate.phone.replace(/[^0-9]/g, '').replace(/^0/, '98') : '';

  // SLA calculation
  const activeStages = ['inbox', 'review', 'interview-1', 'interview-2', 'test'];
  const isActiveStage = activeStages.includes(candidate.stage) || (!['hired', 'rejected', 'archived'].includes(candidate.stage));
  const slaLimit = slaSettings[candidate.stage];
  const daysInStage = getDaysInStage(candidate);
  const slaStatus = isActiveStage && slaLimit
    ? daysInStage >= slaLimit ? 'critical'
    : daysInStage >= slaLimit * 0.75 ? 'warning'
    : null
    : null;

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const actionElement = (e.target as HTMLElement).closest('[data-action]');
    const action = actionElement?.getAttribute('data-action');
    if (action === 'email' || action === 'whatsapp' || action === 'edit' || action === 'compare') {
      e.stopPropagation();
      if (action === 'edit') onEdit(candidate);
      if (action === 'compare') toggleComparison(candidate);
      return;
    }
    onViewDetails(candidate);
  };

  const getFormattedInterviewDate = () => {
    if (!candidate.interviewDate) return '';
    try {
      const [year, month, day] = candidate.interviewDate.split('/').map(Number);
      const pDate = new persianDate([year, month, day]);
      if (candidate.interviewTime) {
        const [hour, minute] = candidate.interviewTime.split(':').map(Number);
        pDate.hour(hour).minute(minute);
        return pDate.format('D MMMM، ساعت HH:mm');
      }
      return pDate.format('D MMMM');
    } catch (e) {
      return candidate.interviewDate;
    }
  };
  const formattedInterviewDate = getFormattedInterviewDate();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={[
        'group relative bg-white rounded-xl p-3.5 mb-3 touch-none cursor-grab transition-all duration-150',
        'border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5',
        isDragging ? 'opacity-60 shadow-xl rotate-1 z-50' : '',
        slaStatus === 'critical' ? 'ring-2 ring-red-300 border-red-200' :
        slaStatus === 'warning'  ? 'ring-2 ring-amber-300 border-amber-200' : '',
      ].join(' ')}
    >
      {/* SLA Badge */}
      {slaStatus && (
        <div className={`absolute -top-2 -right-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold text-white sla-warning shadow ${slaStatus === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {daysInStage}ر
        </div>
      )}

      {/* Header row: name + action icons */}
      <div className="flex justify-between items-start gap-2 mb-1">
        <h3 className="font-bold text-gray-800 text-sm leading-snug truncate">{candidate.name}</h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {candidate.interviewTimeChanged && (
            <span title="زمان مصاحبه تغییر کرده" className="text-amber-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
              </svg>
            </span>
          )}
          {hasTestResult && (
            <span title="نتایج آزمون موجود" className="text-[var(--color-primary-400)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h2a1 1 0 100-2H7zm3 0a1 1 0 000 2h2a1 1 0 100-2h-2z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          <button
            data-action="compare"
            title={inComparison ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
            className={`transition-colors opacity-0 group-hover:opacity-100 ${inComparison ? 'text-[var(--color-primary-500)]' : 'text-gray-300 hover:text-[var(--color-primary-400)]'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
          </button>
          <button
            data-action="edit"
            className="text-gray-300 hover:text-[var(--color-primary-500)] transition-colors opacity-0 group-hover:opacity-100"
            aria-label={`ویرایش ${candidate.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Position badge */}
      <span className="inline-block text-xs font-semibold text-[var(--color-primary-700)] bg-[var(--color-primary-50)] px-2 py-0.5 rounded-full mb-2.5">{candidate.position || 'بدون موقعیت'}</span>

      {/* Contact */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="truncate"><a href={`mailto:${candidate.email}`} className="hover:text-[var(--color-primary-600)] hover:underline transition-colors" data-action="email">{candidate.email}</a></p>
        <div className="flex justify-between items-center">
          <span dir="ltr" className="text-gray-400">{candidate.phone || ''}</span>
          {candidate.phone && (
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-colors" title="واتس‌اپ" data-action="whatsapp">
              <WhatsappIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Footer: rating + interview */}
      {(candidate.rating > 0 || formattedInterviewDate) && (
        <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-100">
          {candidate.rating > 0 ? <StarRating rating={candidate.rating} readOnly /> : <span />}
          {formattedInterviewDate && (
            <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">{formattedInterviewDate}</span>
          )}
        </div>
      )}

      {/* Completeness bar */}
      <div className="mt-2.5" title={`تکمیل بودن پروفایل: ${completeness}٪`}>
        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${completeness >= 80 ? 'bg-emerald-400' : completeness >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
