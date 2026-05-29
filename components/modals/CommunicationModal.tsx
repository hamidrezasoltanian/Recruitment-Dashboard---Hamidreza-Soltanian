import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Candidate } from '../../types';
import { useTemplates } from '../../contexts/TemplateContext';
import { templateService } from '../../services/templateService';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';
import { EmailIcon, WhatsappIcon } from '../ui/Icons';
import { smsService } from '../../services/smsService';

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
}

const CommunicationModal: React.FC<CommunicationModalProps> = ({
  isOpen,
  onClose,
  candidate,
}) => {
  const { templates } = useTemplates();
  const { companyProfile, stages, kavenegarApiKey } = useSettings();
  const { addToast } = useToast();
  const [isSmsLoading, setIsSmsLoading] = useState(false);
  
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [position, setPosition] = useState('');

  useEffect(() => {
    // Reset state on open
    if (isOpen) {
      if (templates.length > 0) {
        setSelectedTemplateId(templates[0].id);
      } else {
        setSelectedTemplateId('');
      }
      
      setPosition(candidate.position || (companyProfile.jobPositions.length > 0 ? companyProfile.jobPositions[0].title : ''));
      
      setMessage('');
    }
  }, [isOpen, templates, companyProfile, candidate]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setMessage('');
      return;
    }
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      const currentStage = stages.find(s => s.id === candidate.stage);
      const finalMessage = templateService.replacePlaceholders(
        template.content,
        candidate,
        { 
            position, 
            companyName: companyProfile.name,
            companyAddress: companyProfile.address,
            companyWebsite: companyProfile.website,
            stageName: currentStage?.title || candidate.stage,
        }
      );
      setMessage(finalMessage);
    }
  }, [selectedTemplateId, templates, candidate, position, companyProfile, stages]);

  const handleSend = (platform: 'email' | 'whatsapp') => {
    if (!message.trim()) {
        addToast("پیام نمی‌تواند خالی باشد.", "error");
        return;
    }

    if (platform === 'email') {
        const subject = `پیام از طرف ${companyProfile.name}`;
        window.open(`mailto:${candidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_blank');
        addToast(`ایمیل برای ${candidate.name} آماده ارسال شد.`, 'success');
    } else { // whatsapp
        const whatsappNumber = candidate.phone ? candidate.phone.replace(/[^0-9]/g, '').replace(/^0/, '98') : '';
        if (whatsappNumber) {
            window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
            addToast(`پیام واتسپ برای ${candidate.name} آماده ارسال شد.`, 'success');
        } else {
            addToast("شماره واتس‌اپ برای این متقاضی ثبت نشده.", "error");
            return; // Don't proceed if no number
        }
    }
    
    onClose();
  };

  const handleSendSms = async () => {
    if (!message.trim()) { addToast('پیام نمی‌تواند خالی باشد.', 'error'); return; }
    if (!candidate.phone) { addToast('شماره تلفن برای این متقاضی ثبت نشده.', 'error'); return; }
    setIsSmsLoading(true);
    try {
      await smsService.send(kavenegarApiKey, candidate.phone, message);
      addToast(`پیامک برای ${candidate.name} ارسال شد.`, 'success');
      onClose();
    } catch (err: any) {
      addToast(err.message || 'خطا در ارسال پیامک.', 'error');
    } finally {
      setIsSmsLoading(false);
    }
  };

  const title = `ارسال پیام به ${candidate.name}`;

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
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.type === 'email' ? 'ایمیل' : 'واتسپ'})</option>
            ))}
          </select>
          {templates.length === 0 && <p className="text-xs text-red-500 mt-1">هیچ قالبی یافت نشد. لطفا از تنظیمات اضافه کنید.</p>}
        </div>

        {templateService.hasPlaceholder(templates.find(t => t.id === selectedTemplateId)?.content, 'position') ? (
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
              {companyProfile.jobPositions.length === 0 && <p className="text-xs text-red-500 mt-1">هیچ موقعیت شغلی تعریف نشده. لطفا از تنظیمات {' > '} پروفایل شرکت اضافه کنید.</p>}
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

        <div className="flex flex-wrap justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-5 rounded-xl hover:bg-gray-300 transition-colors text-sm font-semibold">انصراف</button>
          {kavenegarApiKey && (
            <button type="button" onClick={handleSendSms} disabled={!candidate.phone || isSmsLoading} className="bg-violet-600 text-white py-2 px-5 rounded-xl hover:bg-violet-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
              <span>{isSmsLoading ? 'در حال ارسال...' : 'ارسال پیامک'}</span>
            </button>
          )}
          <button type="button" onClick={() => handleSend('whatsapp')} disabled={!candidate.phone} className="bg-teal-600 text-white py-2 px-5 rounded-xl hover:bg-teal-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-semibold">
            <WhatsappIcon className="w-5 h-5"/>
            <span>واتسپ</span>
          </button>
          <button type="button" onClick={() => handleSend('email')} className="bg-sky-600 text-white py-2 px-5 rounded-xl hover:bg-sky-700 flex items-center gap-2 text-sm font-semibold">
            <EmailIcon className="w-5 h-5"/>
            <span>ایمیل</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CommunicationModal;