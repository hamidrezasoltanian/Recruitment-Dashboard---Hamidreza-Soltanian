import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Candidate } from '../../types';
import StarRating from '../ui/StarRating';
import { getJobColor } from '../../utils/colorUtils';
import { WhatsappIcon } from '../ui/Icons';

declare const persianDate: any;

interface KanbanCardProps {
  candidate: Candidate;
  onViewDetails: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ candidate, onViewDetails, onEdit }) => {
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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click target or its parent is an actionable link (email, whatsapp)
    const actionElement = (e.target as HTMLElement).closest('[data-action]');
    const action = actionElement?.getAttribute('data-action');

    if (action === 'email' || action === 'whatsapp' || action === 'edit') {
      // Allow default browser action for links, and stop this event from bubbling
      e.stopPropagation();
      if(action === 'edit') onEdit(candidate);
      return;
    }
    
    // For any other click inside the card, open details.
    // The PointerSensor in KanbanBoard ensures this only fires on a click, not a drag.
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
    } catch(e) {
        console.error("Error formatting Persian date:", e);
        return candidate.interviewDate;
    }
  };
  const formattedInterviewDate = getFormattedInterviewDate();

  const initials = candidate.name
    ? candidate.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('')
    : '?';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`group relative bg-white rounded-xl shadow-sm p-3.5 mb-3 touch-none transition-all hover:shadow-md hover:-translate-y-0.5 cursor-grab border border-gray-100 ${isDragging ? 'opacity-40 shadow-2xl scale-105 z-50 rotate-1' : ''}`}
    >
      {/* Top row: Avatar + Name + Actions */}
      <div className="flex items-start gap-2.5 mb-2.5">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
          style={{ background: `${jobColor}` }}
        >
          {initials}
        </div>

        {/* Name + position */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 text-sm leading-tight truncate">{candidate.name}</h3>
          <p className="text-xs font-medium mt-0.5 truncate" style={{color: 'var(--color-primary-600)'}}>{candidate.position || 'بدون موقعیت'}</p>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {candidate.interviewTimeChanged && (
            <span title="زمان مصاحبه تغییر کرده" className="text-amber-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/></svg>
            </span>
          )}
          {hasTestResult && (
            <span title="نتایج آزمون موجود است" className="text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h2a1 1 0 100-2H7zm3 0a1 1 0 000 2h2a1 1 0 100-2h-2z" clipRule="evenodd" /></svg>
            </span>
          )}
          <button
            data-action="edit"
            className="text-gray-300 hover:text-[var(--color-primary-500)] transition-colors p-0.5 rounded"
            aria-label={`ویرایش ${candidate.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </div>

      {/* Contact row */}
      <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 space-y-1">
        {candidate.email && (
          <div className="flex items-center gap-1.5 truncate">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <a href={`mailto:${candidate.email}`} className="truncate hover:underline" style={{color:'var(--color-primary-600)'}} data-action="email">{candidate.email}</a>
          </div>
        )}
        {candidate.phone && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <span dir="ltr">{candidate.phone}</span>
            </div>
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600 mr-1" title="واتس‌اپ" data-action="whatsapp">
              <WhatsappIcon className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Footer: rating + interview date */}
      {(candidate.rating > 0 || formattedInterviewDate) && (
        <div className="flex justify-between items-center mt-2.5">
          {candidate.rating > 0 ? <StarRating rating={candidate.rating} readOnly /> : <span></span>}
          {formattedInterviewDate && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {formattedInterviewDate}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
