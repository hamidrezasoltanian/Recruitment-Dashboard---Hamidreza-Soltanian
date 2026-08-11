import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Candidate } from '../../types';
import InterviewEvaluationPanel from '../evaluation/InterviewEvaluationPanel';

interface ResumeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  candidate?: Candidate | null;
}

const ResumeViewerModal: React.FC<ResumeViewerModalProps> = ({ isOpen, onClose, file, candidate }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (isOpen && file) {
      url = URL.createObjectURL(file);
      setFileUrl(url);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
        setFileUrl(null);
      }
    };
  }, [isOpen, file]);

  const handleDownload = () => {
      if (fileUrl && file) {
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  const isPdf = file?.type === 'application/pdf';
  const title = candidate
    ? `رزومه ${candidate.name}`
    : file
      ? `مشاهده رزومه: ${file.name}`
      : 'مشاهده رزومه';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="flex flex-col lg:flex-row gap-4 min-h-[70vh]">
        <div className="flex-1 min-w-0">
          {isPdf && fileUrl ? (
            <iframe src={fileUrl} className="w-full h-[70vh] lg:h-[80vh] border rounded-md" title="Resume Preview"></iframe>
          ) : file ? (
            <div className="p-8 text-center bg-gray-100 rounded-lg h-full flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold text-gray-800">پیش‌نمایش برای این نوع فایل در دسترس نیست.</h3>
              <p className="text-gray-600 mt-2">نوع فایل: {file.type}</p>
              <button
                onClick={handleDownload}
                className="mt-6 bg-[var(--color-primary-600)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[var(--color-primary-700)] transition-colors"
              >
                دانلود فایل
              </button>
            </div>
          ) : (
               <div className="p-8 text-center bg-gray-100 rounded-lg">
                  <p>در حال بارگذاری فایل...</p>
              </div>
          )}
        </div>

        {candidate && (
          <aside className="w-full lg:w-[420px] flex-shrink-0 max-h-[80vh] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/60 p-3">
            <InterviewEvaluationPanel candidate={candidate} compact />
          </aside>
        )}
      </div>
    </Modal>
  );
};

export default ResumeViewerModal;
