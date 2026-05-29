import React, { useRef, useEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  size?: 'default' | 'large' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, size = 'default' }) => {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = modalRef.current;
    if (el) {
      if (isOpen) el.showModal();
      else el.close();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape') onClose();
  };

  // On mobile: near full-screen with max-height and scroll.
  // On desktop: constrained width.
  const sizeClasses = {
    default: 'w-[95vw] sm:w-11/12 sm:max-w-2xl',
    large:   'w-[95vw] sm:w-11/12 sm:max-w-4xl',
    xl:      'w-[95vw] sm:w-11/12 sm:max-w-7xl',
  };

  const modalContent = (
    <dialog
      ref={modalRef}
      onKeyDown={handleKeyDown}
      onClose={onClose}
      className={`p-0 rounded-2xl shadow-2xl bg-white backdrop:bg-black/60 ${sizeClasses[size]} max-h-[92dvh] flex flex-col`}
      style={{ margin: 'auto' }}
    >
      {/* Sticky header */}
      <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0 rounded-t-2xl">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate ml-3">{title}</h2>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Scrollable body */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1">
        {children}
      </div>
    </dialog>
  );

  return ReactDOM.createPortal(modalContent, document.getElementById('modal-root')!);
};

export default Modal;
