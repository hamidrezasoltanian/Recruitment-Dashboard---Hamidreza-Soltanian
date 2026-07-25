import React, { ReactNode, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  size?: 'default' | 'large' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, size = 'default' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const sizeClasses = {
    default: 'w-11/12 max-w-2xl',
    large: 'w-11/12 max-w-4xl',
    xl: 'w-11/12 max-w-7xl',
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl border border-slate-200/80 ${sizeClasses[size]} max-h-[92vh] overflow-hidden flex flex-col fade-in`}
        style={{ boxShadow: '0 25px 50px -12px rgba(15, 39, 68, 0.28)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center"
          style={{
            background: 'linear-gradient(120deg, #f8fafc 0%, #eff6ff 55%, #f8fafc 100%)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-1 h-6 rounded-full bg-[var(--color-primary-500)] flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all"
            aria-label="بستن"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
