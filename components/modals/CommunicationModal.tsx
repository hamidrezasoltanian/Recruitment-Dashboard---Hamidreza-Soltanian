import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { Candidate, Template } from '../../types';
import { useTemplates } from '../../contexts/TemplateContext';
import { templateService } from '../../services/templateService';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  communicationType: 'email' | 'whatsapp';
  actionType: 'offer' | 'invite';
}

const CommunicationModal: React.FC<CommunicationModalProps> = ({
  isOpen,
  onClose,
  candidate,
  communicationType,
  actionType,
}) => {
  const { templates } = useTemplates();
  const { companyProfile } = useSettings();
  const { addToast } = useToast();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [position, setPosition] = useState('');

  const relevantTemplates = useMemo(() => 
    templates.filter(t => t.type === communicationType),
    [templates, communicationType]
  );

  useEffect(() => {
    // Reset state on open
    if (isOpen) {
      if (relevantTemplates.length > 0) {
        setSelectedTemplateId(relevantTemplates[0].id);
      } else {
        setSelectedTemplateId('');
      }
      
      if (companyProfile.jobPositions.length > 0) {
        setPosition(companyProfile.jobPositions[0].title);
      } else {
        setPosition('');
      }
      
      setMessage('');
    }
  }, [isOpen, relevantTemplates, companyProfile]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setMessage('');
      return;
    }
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      const finalMessage = templateService.replacePlaceholders(
        template.content,
        candidate,
        { 
            position, 
            companyName: companyProfile.name,
            companyAddress: companyProfile.address,
            companyWebsite: companyProfile.website
        }
      );
      setMessage(finalMessage);
    }
  }, [selectedTemplateId, templates, candidate, position, companyProfile]);

  const handleSend = () => {
    if (!message.trim()) {
        addToast("پیام نمی‌تواند خالی باشد.", "error");
        return;
    }
    if (actionType === 'offer' && !position) {
        addToast("لطفا یک موقعیت شغلی انتخاب کنید.", "error");
        return;
    }
    // In a real app, this would integrate with an email/messaging service
    console.log({
        to: communicationType === 'email' ? candidate.email : candidate.phone,
        type: communicationType,
        message: message
    });
    alert(`پیام زیر (به صورت نمایشی) ارسال شد:\n\n${message}`);
    onClose();
  };
  
  const title = `ارسال ${communicationType === 'email' ? 'ایمیل' : 'واتسپ'} ${actionType === 'offer' ? 'پیشنهاد شغلی' : 'دعوت به مصاحبه'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div>
          <label htmlFor="template-select" className="block text-sm font-medium text-gray-700">انتخاب قالب</label>
          <select 
            id="template-select" 
            value={selectedTemplateId} 
            onChange={e => setSelectedTemplateId(e.target.value)}
            className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="" disabled>یک قالب انتخاب کنید...</option>
            {relevantTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {relevantTemplates.length === 0 && <p className="text-xs text-red-500 mt-1">هیچ قالب {communicationType === 'email' ? 'ایمیل' : 'واتسپ'} یافت نشد. لطفا از تنظیمات اضافه کنید.</p>}
        </div>

        {actionType === 'offer' || (templateService.hasPlaceholder(templates.find(t => t.id === selectedTemplateId)?.content, 'position')) ? (
           <div>
             <label htmlFor="position-title" className="block text-sm font-medium text-gray-700">عنوان موقعیت شغلی</label>
             <select
                id="position-title"
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="" disabled>یک موقعیت انتخاب کنید...</option>
                {companyProfile.jobPositions.map(job => (
                    <option key={job.id} value={job.title}>{job.title}</option>
                ))}
              </select>
              {companyProfile.jobPositions.length === 0 && <p className="text-xs text-red-500 mt-1">هیچ موقعیت شغلی تعریف نشده. لطفا از تنظیمات > پروفایل شرکت اضافه کنید.</p>}
           </div>
        ) : null}

        <div>
            <label htmlFor="message-content" className="block text-sm font-medium text-gray-700">متن پیام نهایی</label>
            <textarea
              id="message-content"
              rows={10}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
            />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">انصراف</button>
          <button type="button" onClick={handleSend} className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors">ارسال</button>
        </div>
      </div>
    </Modal>
  );
};

export default CommunicationModal;
