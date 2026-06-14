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

  const modalContent = (
    <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className={`relative bg-white rounded-xl shadow-2xl ${sizeClasses[size]} max-h-[90vh] overflow-hidden`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;