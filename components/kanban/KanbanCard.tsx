import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Candidate } from '../../types';
import StarRating from '../ui/StarRating';

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

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  
  const hasTestResult = candidate.testResults && candidate.testResults.some(r => r.file);
  const whatsappNumber = candidate.phone ? candidate.phone.replace(/[^0-9]/g, '').replace(/^0/, '98') : '';

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click target or its parent is an actionable link (email, whatsapp)
    const actionElement = (e.target as HTMLElement).closest('[data-action]');
    const action = actionElement?.getAttribute('data-action');

    if (action === 'email' || action === 'whatsapp') {
      // Allow default browser action for links, and stop this event from bubbling
      // up to any other handlers that might, for instance, open the details modal.
      e.stopPropagation();
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`group relative bg-white rounded-lg shadow-md p-3 mb-4 touch-none transition-shadow hover:shadow-lg cursor-grab ${isDragging ? 'opacity-50 shadow-2xl z-50' : ''}`}
    >
        {/* Top section: Name and icons */}
        <div className="flex justify-between items-start">
            <h3 className="font-bold w-full truncate pr-2">{candidate.name}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
                {candidate.interviewTimeChanged && (
                    <span title="زمان مصاحبه تغییر کرده، اطلاع‌رسانی کنید" className="text-amber-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/></svg>
                    </span>
                )}
                {hasTestResult && (
                    <span title="مشاهده نتایج آزمون" className="text-blue-500 hover:text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h2a1 1 0 100-2H7zm3 0a1 1 0 000 2h2a1 1 0 100-2h-2z" clipRule="evenodd" /></svg>
                    </span>
                )}
                 <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(candidate); }} 
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    aria-label={`ویرایش ${candidate.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                </button>
            </div>
        </div>
        
        {/* Job Position */}
        <p className="text-sm font-medium text-indigo-600 mb-2">{candidate.position || 'بدون موقعیت'}</p>

        {/* Contact Info */}
        <div className="border-t border-gray-200 mt-2 pt-2 text-xs text-gray-600 space-y-1">
            <p className="truncate">ایمیل: <a href={`mailto:${candidate.email}`} className="text-indigo-600 hover:underline" data-action="email">{candidate.email}</a></p>
            <div className="flex justify-between items-center">
                <p>موبایل: <span dir="ltr">{candidate.phone || 'ندارد'}</span></p>
                {candidate.phone && (
                    <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600" title="ارسال پیام در واتس‌اپ" data-action="whatsapp">
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 12c0 1.74.44 3.37 1.25 4.81L2 22l5.34-1.38c1.38.75 2.94 1.18 4.57 1.18h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zM9.53 8.3c.24-.12.55-.21.77-.23.29-.03.58.13.8.38.22.25.77 1.02.77 1.02s.22.25.34.38c.12.12.25.14.38.12s.8-.38.8-.38l.38-.18c.22-.12.38-.06.55.12l.77.9c.17.17.21.36.14.55s-.3.55-.42.67c-.12.12-.25.18-.38.18s-.3-.03-.3-.03l-1.15-.67c-.22-.12-.47-.03-.6.22l-.67.83c-.15.18-.34.25-.53.21s-.42-.22-.74-.42c-1.9-1.15-3.17-3.23-3.26-3.38-.09-.15-.77-1.02-.77-1.02s-.12-.25 0-.47c.12-.22.25-.28.34-.34z"/></svg>
                    </a>
                )}
            </div>
        </div>
        
        {/* Rating and Interview */}
        <div className="flex justify-between items-end mt-2">
            {candidate.rating > 0 && <StarRating rating={candidate.rating} readOnly />}
            {formattedInterviewDate && (
                <p className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-1 rounded">مصاحبه: {formattedInterviewDate}</p>
            )}
        </div>
    </div>
  );
};

export default KanbanCard;