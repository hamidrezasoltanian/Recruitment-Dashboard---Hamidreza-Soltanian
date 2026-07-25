import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { Candidate } from '../../types';
import { useTemplates } from '../../contexts/TemplateContext';
import { templateService } from '../../services/templateService';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';
import { EmailIcon, WhatsappIcon } from '../ui/Icons';

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
  const { companyProfile, stages } = useSettings();
  const { addToast } = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [position, setPosition] = useState('');

  const formatWhatsAppNumber = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) return '98' + cleaned.substring(1);
    if (cleaned.startsWith('98')) return cleaned;
    if (cleaned.length === 10) return '98' + cleaned;
    return cleaned;
  };

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      const aMatch = a.stageId === candidate.stage ? 0 : a.stageId ? 1 : 2;
      const bMatch = b.stageId === candidate.stage ? 0 : b.stageId ? 1 : 2;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.name.localeCompare(b.name, 'fa');
    });
  }, [templates, candidate.stage]);

  const pickDefaultTemplateId = () => {
    const stageEmail = templates.find((t) => t.stageId === candidate.stage && t.type === 'email');
    if (stageEmail) return stageEmail.id;
    const stageAny = templates.find((t) => t.stageId === candidate.stage);
    if (stageAny) return stageAny.id;
    return templates[0]?.id || '';
  };

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTemplateId(pickDefaultTemplateId());
    setPosition(
      candidate.position ||
        (companyProfile.jobPositions.length > 0 ? companyProfile.jobPositions[0].title : '')
    );
  }, [isOpen, templates, companyProfile, candidate]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setMessage('');
      return;
    }
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    const currentStage = stages.find((s) => s.id === candidate.stage);
    const finalMessage = templateService.replacePlaceholders(template.content, candidate, {
      position,
      companyName: companyProfile.name,
      companyAddress: companyProfile.address,
      companyWebsite: companyProfile.website,
      stageName: currentStage?.title || candidate.stage,
    });
    setMessage(finalMessage);
  }, [selectedTemplateId, templates, candidate, position, companyProfile, stages]);

  const handleSend = (platform: 'email' | 'whatsapp') => {
    if (!message.trim()) {
      addToast('پیام نمی‌تواند خالی باشد.', 'error');
      return;
    }

    if (platform === 'email') {
      const subject = `پیام از طرف ${companyProfile.name}`;
      window.open(
        `mailto:${candidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
        '_blank'
      );
      addToast(`ایمیل برای ${candidate.name} آماده ارسال شد.`, 'success');
    } else {
      const whatsappNumber = formatWhatsAppNumber(candidate.phone || '');
      if (!whatsappNumber) {
        addToast('شماره واتس‌اپ برای این متقاضی ثبت نشده.', 'error');
        return;
      }
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl1 = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      const whatsappUrl2 = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;
      try {
        window.location.href = whatsappUrl2;
      } catch {
        window.open(whatsappUrl1, '_blank');
      }
      setTimeout(() => window.open(whatsappUrl1, '_blank'), 400);
      addToast(`پیام واتسپ برای ${candidate.name} آماده ارسال شد.`, 'success');
    }

    onClose();
  };

  const stageTitle = stages.find((s) => s.id === candidate.stage)?.title || candidate.stage;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`ارسال پیام به ${candidate.name}`} size="large">
      <div className="space-y-5">
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-900">
          مرحله فعلی متقاضی: <strong>{stageTitle}</strong>
          <span className="text-sky-700/80"> — قالب پیش‌فرض بر اساس همین مرحله انتخاب شده؛ می‌توانید عوض یا ویرایش کنید.</span>
        </div>

        <div>
          <label htmlFor="template-select" className="block text-sm font-semibold text-slate-700">
            انتخاب قالب
          </label>
          <select
            id="template-select"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="mt-1.5 block w-full border border-slate-200 bg-white rounded-xl shadow-sm py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            <option value="" disabled>
              یک قالب انتخاب کنید...
            </option>
            {sortedTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.type === 'email' ? 'ایمیل' : 'واتساپ'})
                {t.stageId === candidate.stage ? ' ★ مرحله فعلی' : ''}
              </option>
            ))}
          </select>
          {templates.length === 0 && (
            <p className="text-xs text-red-500 mt-1">هیچ قالبی یافت نشد. لطفا از تنظیمات اضافه کنید.</p>
          )}
        </div>

        {templateService.hasPlaceholder(
          templates.find((t) => t.id === selectedTemplateId)?.content,
          'position'
        ) ? (
          <div>
            <label htmlFor="position-title" className="block text-sm font-semibold text-slate-700">
              عنوان موقعیت شغلی
            </label>
            <select
              id="position-title"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1.5 block w-full border border-slate-200 bg-white rounded-xl shadow-sm py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            >
              <option value="" disabled>
                یک موقعیت انتخاب کنید...
              </option>
              {companyProfile.jobPositions.map((job) => (
                <option key={job.id} value={job.title}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label htmlFor="message-content" className="block text-sm font-semibold text-slate-700">
            متن پیام نهایی
            <span className="text-xs font-normal text-slate-500 mr-2">(قابل ویرایش قبل از ارسال)</span>
          </label>
          <textarea
            id="message-content"
            rows={12}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1.5 block w-full border border-slate-200 rounded-xl shadow-sm py-3 px-3 text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 text-slate-700 py-2.5 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => handleSend('whatsapp')}
            disabled={!candidate.phone}
            className="bg-teal-600 text-white py-2.5 px-6 rounded-xl hover:bg-teal-700 flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold text-sm"
          >
            <WhatsappIcon className="w-5 h-5" />
            <span>ارسال واتساپ</span>
          </button>
          <button
            type="button"
            onClick={() => handleSend('email')}
            className="bg-sky-600 text-white py-2.5 px-6 rounded-xl hover:bg-sky-700 flex items-center gap-2 font-semibold text-sm"
          >
            <EmailIcon className="w-5 h-5" />
            <span>ارسال ایمیل</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CommunicationModal;
