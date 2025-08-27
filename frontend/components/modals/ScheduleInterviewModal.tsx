import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { StageChangeInfo, Candidate } from '../../types';
import { useTemplates } from '../../contexts/TemplateContext';
import { templateService } from '../../services/templateService';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import KamaDatePicker from '../ui/KamaDatePicker';
import { useAuth } from '../../contexts/AuthContext';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageChangeInfo: StageChangeInfo;
  onConfirm: (updatedCandidate: Candidate, sendEmail: boolean, emailBody: string) => void;
}

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  stageChangeInfo,
  onConfirm,
}) => {
  const { templates } = useTemplates();
  const { companyProfile } = useSettings();
  const { users } = useAuth();
  const { addToast } = useToast();

  const { candidate, newStage } = stageChangeInfo;
  const availableInterviewers = users.filter(u => u.email);

  const [interviewDate, setInterviewDate] = useState(candidate.interviewDate || '');
  const [interviewTime, setInterviewTime] = useState(candidate.interviewTime || '');
  const [interviewerId, setInterviewerId] = useState(candidate.interviewerId || '');
  const [sendNotification, setSendNotification] = useState(true);
  const [message, setMessage] = useState('');

  const relevantTemplate = useMemo(() => {
    return templates.find(t => t.stageId === newStage.id && t.type === 'email');
  }, [templates, newStage.id]);

  useEffect(() => {
      if (isOpen) {
        setInterviewDate(candidate.interviewDate || '');
        setInterviewTime(candidate.interviewTime || '');
        setInterviewerId(candidate.interviewerId || '');
      }
  }, [candidate, isOpen]);

  useEffect(() => {
    if (relevantTemplate) {
        const candidateWithScheduledData = {
            ...candidate,
            interviewDate,
            interviewTime
        };
      const finalMessage = templateService.replacePlaceholders(
        relevantTemplate.content,
        candidateWithScheduledData,
        {
          companyName: companyProfile.name,
          companyAddress: companyProfile.address,
          companyWebsite: companyProfile.website,
          stageName: newStage.title,
        }
      );
      setMessage(finalMessage);
      setSendNotification(true);
    } else {
      setMessage('');
      setSendNotification(false);
    }
  }, [relevantTemplate, candidate, newStage, companyProfile, interviewDate, interviewTime]);

  const handleConfirm = () => {
    if (!interviewDate || !interviewTime) {
      addToast('لطفا تاریخ و ساعت مصاحبه را مشخص کنید.', 'error');
      return;
    }

    const selectedInterviewer = users.find(u => u.id === interviewerId);
    
    const updatedCandidate: Candidate = {
        ...candidate,
        stage: newStage.id,
        interviewDate,
        interviewTime,
        interviewerId: interviewerId || undefined,
        interviewerName: selectedInterviewer?.name || undefined,
    };
    
    onConfirm(updatedCandidate, sendNotification && !!relevantTemplate, message);
  };

  const title = `زمان‌بندی مصاحبه برای: ${candidate.name}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p>
          شما در حال انتقال متقاضی به مرحله <strong className="font-bold">{newStage.title}</strong> هستید. لطفاً جزئیات مصاحبه را وارد کنید.
        </p>

        {/* Form for scheduling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-100 rounded-lg">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ مصاحبه</label>
                <KamaDatePicker value={interviewDate} onChange={setInterviewDate} />
            </div>
            <div>
                <label htmlFor="interviewTimeModal" className="block text-sm font-medium text-gray-700 mb-1">ساعت مصاحبه</label>
                <input type="time" id="interviewTimeModal" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="md:col-span-2">
                <label htmlFor="interviewerModal" className="block text-sm font-medium text-gray-700">مصاحبه‌کننده</label>
                <select id="interviewerModal" value={interviewerId} onChange={e => setInterviewerId(e.target.value)} className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="">انتخاب کنید...</option>
                    {availableInterviewers.map(user => (
                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                    ))}
                </select>
                {availableInterviewers.length === 0 && <p className="text-xs text-gray-500 mt-1">هیچ کاربری با ایمیل ثبت‌شده یافت نشد.</p>}
            </div>
        </div>

        {/* Communication Part */}
        {relevantTemplate ? (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="send-notification-checkbox-schedule"
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="send-notification-checkbox-schedule" className="mr-2 block text-sm text-gray-900">
                ارسال ایمیل اطلاع‌رسانی به متقاضی
              </label>
            </div>
            {sendNotification && (
              <div>
                <label htmlFor="message-preview-schedule" className="block text-sm font-medium text-gray-700">پیش‌نمایش پیام</label>
                <textarea
                  id="message-preview-schedule"
                  rows={8}
                  value={message}
                  readOnly
                  className="mt-1 block w-full border border-gray-200 bg-gray-50 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-md">
            هیچ قالب ایمیلی برای این مرحله تعریف نشده است.
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">انصراف</button>
          <button type="button" onClick={handleConfirm} className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
            {sendNotification && relevantTemplate ? 'انتقال و ارسال ایمیل' : 'انتقال و ذخیره'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ScheduleInterviewModal;
