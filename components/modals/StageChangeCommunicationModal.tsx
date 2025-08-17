import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { StageChangeInfo } from '../../types';
import { useTemplates } from '../../contexts/TemplateContext';
import { templateService } from '../../services/templateService';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';

interface StageChangeCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageChangeInfo: StageChangeInfo;
  onConfirm: () => void;
}

const StageChangeCommunicationModal: React.FC<StageChangeCommunicationModalProps> = ({
  isOpen,
  onClose,
  stageChangeInfo,
  onConfirm,
}) => {
  const { templates } = useTemplates();
  const { companyProfile } = useSettings();
  const { addToast } = useToast();

  const { candidate, newStage } = stageChangeInfo;

  const [sendNotification, setSendNotification] = useState(true);
  const [message, setMessage] = useState('');

  const relevantTemplate = useMemo(() => {
    return templates.find(t => t.stageId === newStage.id && t.type === 'email');
  }, [templates, newStage.id]);

  useEffect(() => {
    if (relevantTemplate) {
      const finalMessage = templateService.replacePlaceholders(
        relevantTemplate.content,
        candidate,
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
  }, [relevantTemplate, candidate, newStage, companyProfile]);

  const handleConfirm = () => {
    if (sendNotification) {
      if (!message.trim()) {
        addToast('قالب پیام برای این مرحله خالی است. نمی‌توان ایمیل ارسال کرد.', 'error');
        return;
      }
      console.log(`Sending email to ${candidate.email}:\n\n${message}`);
      addToast(`ایمیل اطلاع‌رسانی به ${candidate.name} ارسال شد. (نمایشی)`, 'success');
    }
    onConfirm();
  };

  const title = `تغییر مرحله به "${newStage.title}"`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p>
          شما در حال انتقال متقاضی <strong className="font-bold">{candidate.name}</strong> به مرحله <strong className="font-bold">{newStage.title}</strong> هستید.
        </p>

        {relevantTemplate ? (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="send-notification-checkbox"
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="send-notification-checkbox" className="mr-2 block text-sm text-gray-900">
                ارسال ایمیل اطلاع‌رسانی به متقاضی
              </label>
            </div>
            {sendNotification && (
              <div>
                <label htmlFor="message-preview" className="block text-sm font-medium text-gray-700">پیش‌نمایش پیام</label>
                <textarea
                  id="message-preview"
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
            هیچ قالب ایمیلی برای مرحله "{newStage.title}" تعریف نشده است. برای فعال کردن اطلاع‌رسانی خودکار، از بخش تنظیمات یک قالب برای این مرحله بسازید.
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">انصراف</button>
          <button type="button" onClick={handleConfirm} className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
            {sendNotification && relevantTemplate ? 'انتقال و ارسال ایمیل' : 'انتقال بدون اطلاع‌رسانی'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StageChangeCommunicationModal;
