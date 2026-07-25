import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { StageChangeInfo } from '../../types';
import { useTemplates } from '../../contexts/TemplateContext';
import { templateService } from '../../services/templateService';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { EmailIcon, WhatsappIcon } from '../ui/Icons';

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

  const formatWhatsAppNumber = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) return '98' + cleaned.substring(1);
    if (cleaned.startsWith('98')) return cleaned;
    if (cleaned.length === 10) return '98' + cleaned;
    return cleaned;
  };

  const companyCtx = useMemo(
    () => ({
      companyName: companyProfile.name,
      companyAddress: companyProfile.address,
      companyWebsite: companyProfile.website,
      name: companyProfile.name,
      website: companyProfile.website,
      address: companyProfile.address,
      stageName: newStage.title,
      position: candidate.position,
    }),
    [companyProfile, newStage.title, candidate.position]
  );

  const buildMessage = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return '';
    return templateService.replacePlaceholders(template.content, candidate, companyCtx);
  };

  const emailTemplates = useMemo(() => templates.filter((t) => t.type === 'email'), [templates]);
  const whatsappTemplates = useMemo(() => templates.filter((t) => t.type === 'whatsapp'), [templates]);

  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('');
  const [selectedWhatsappTemplateId, setSelectedWhatsappTemplateId] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [emailMessage, setEmailMessage] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const [sendNotification, setSendNotification] = useState(true);
  const [communicationType, setCommunicationType] = useState<'email' | 'whatsapp'>('email');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [standardMessage, setStandardMessage] = useState('');

  const isInterviewStage = useMemo(() => newStage.id.startsWith('interview-'), [newStage.id]);

  useEffect(() => {
    if (!isOpen) return;

    const defaultEmailTpl =
      templates.find((t) => t.stageId === newStage.id && t.type === 'email') ||
      templates.find((t) => !t.stageId && t.type === 'email') ||
      templates.find((t) => t.type === 'email');
    const defaultWhatsappTpl =
      templates.find((t) => t.stageId === newStage.id && t.type === 'whatsapp') ||
      templates.find((t) => !t.stageId && t.type === 'whatsapp') ||
      templates.find((t) => t.type === 'whatsapp');

    setSelectedEmailTemplateId(defaultEmailTpl?.id || '');
    setSelectedWhatsappTemplateId(defaultWhatsappTpl?.id || '');
    setSendEmail(!!templates.find((t) => t.stageId === newStage.id && t.type === 'email'));
    setSendWhatsapp(!!templates.find((t) => t.stageId === newStage.id && t.type === 'whatsapp'));

    const defaultStandardTpl =
      templates.find((t) => t.stageId === newStage.id && t.type === communicationType) ||
      templates.find((t) => !t.stageId && t.type === communicationType) ||
      templates.find((t) => t.type === communicationType);
    setSelectedTemplateId(defaultStandardTpl?.id || '');
    setSendNotification(!!defaultStandardTpl);
  }, [isOpen, newStage.id, templates, communicationType]);

  useEffect(() => {
    if (selectedEmailTemplateId) setEmailMessage(buildMessage(selectedEmailTemplateId));
    else setEmailMessage('');
  }, [selectedEmailTemplateId, templates, candidate, companyCtx]);

  useEffect(() => {
    if (selectedWhatsappTemplateId) setWhatsappMessage(buildMessage(selectedWhatsappTemplateId));
    else setWhatsappMessage('');
  }, [selectedWhatsappTemplateId, templates, candidate, companyCtx]);

  useEffect(() => {
    if (selectedTemplateId) setStandardMessage(buildMessage(selectedTemplateId));
    else setStandardMessage('');
  }, [selectedTemplateId, templates, candidate, companyCtx]);

  const openWhatsApp = (message: string) => {
    const whatsappNumber = formatWhatsAppNumber(candidate.phone || '');
    if (!whatsappNumber) {
      addToast('ارسال واتساپ ناموفق: شماره تلفن نامعتبر است.', 'error');
      return false;
    }
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    try {
      window.location.href = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;
    } catch {
      window.open(url, '_blank');
    }
    setTimeout(() => window.open(url, '_blank'), 400);
    return true;
  };

  const handleConfirm = () => {
    let notificationsSent = false;

    if (isInterviewStage) {
      if (sendEmail && emailMessage.trim()) {
        window.open(
          `mailto:${candidate.email}?subject=${encodeURIComponent(`دعوت به مصاحبه — ${companyProfile.name}`)}&body=${encodeURIComponent(emailMessage)}`,
          '_blank'
        );
        notificationsSent = true;
      }
      if (sendWhatsapp && whatsappMessage.trim()) {
        if (openWhatsApp(whatsappMessage)) notificationsSent = true;
      }
      if (notificationsSent) {
        addToast(`پیام‌های اطلاع‌رسانی برای ${candidate.name} آماده ارسال شدند.`, 'success');
      }
    } else if (sendNotification) {
      if (!standardMessage.trim()) {
        addToast('متن پیام خالی است.', 'error');
        return;
      }
      if (communicationType === 'email') {
        window.open(
          `mailto:${candidate.email}?subject=${encodeURIComponent(`به‌روزرسانی فرایند جذب — ${companyProfile.name}`)}&body=${encodeURIComponent(standardMessage)}`,
          '_blank'
        );
        addToast(`ایمیل اطلاع‌رسانی برای ${candidate.name} آماده ارسال شد.`, 'success');
      } else {
        if (!openWhatsApp(standardMessage)) return;
        addToast(`پیام واتساپ برای ${candidate.name} آماده ارسال شد.`, 'success');
      }
    }

    onConfirm();
  };

  const sortByStage = <T extends { stageId?: string; name: string }>(list: T[]) =>
    [...list].sort((a, b) => {
      const aMatch = a.stageId === newStage.id ? 0 : a.stageId ? 1 : 2;
      const bMatch = b.stageId === newStage.id ? 0 : b.stageId ? 1 : 2;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.name.localeCompare(b.name, 'fa');
    });

  const renderInterviewOptions = () => (
    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-right" dir="rtl">
      <p className="font-bold text-slate-800">ارسال پیام دعوت به مصاحبه:</p>
      <p className="text-xs text-slate-500">
        قالب پیش‌فرض مرحله «{newStage.title}» انتخاب شده است. متن را قبل از ارسال می‌توانید ویرایش کنید.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 text-[var(--color-primary-600)] border-gray-300 rounded"
            />
            <span className="font-bold text-sm text-slate-700">ارسال ایمیل</span>
          </label>
          {sendEmail && (
            <>
              <select
                value={selectedEmailTemplateId}
                onChange={(e) => setSelectedEmailTemplateId(e.target.value)}
                className="block w-full border border-slate-200 bg-white rounded-xl shadow-sm py-2.5 px-3 text-sm"
              >
                <option value="">-- بدون قالب --</option>
                {sortByStage(emailTemplates).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.stageId === newStage.id ? ' ★ این مرحله' : ''}
                  </option>
                ))}
              </select>
              <textarea
                rows={8}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm leading-7"
                placeholder="متن ایمیل..."
              />
            </>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendWhatsapp}
              onChange={(e) => setSendWhatsapp(e.target.checked)}
              className="h-4 w-4 text-[var(--color-primary-600)] border-gray-300 rounded"
            />
            <span className="font-bold text-sm text-slate-700">ارسال واتساپ</span>
          </label>
          {sendWhatsapp && (
            <>
              <select
                value={selectedWhatsappTemplateId}
                onChange={(e) => setSelectedWhatsappTemplateId(e.target.value)}
                className="block w-full border border-slate-200 bg-white rounded-xl shadow-sm py-2.5 px-3 text-sm"
              >
                <option value="">-- بدون قالب --</option>
                {sortByStage(whatsappTemplates).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.stageId === newStage.id ? ' ★ این مرحله' : ''}
                  </option>
                ))}
              </select>
              <textarea
                rows={8}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm leading-7"
                placeholder="متن واتساپ..."
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderStandardOptions = () => {
    const currentTemplates = communicationType === 'email' ? emailTemplates : whatsappTemplates;

    return (
      <div className="space-y-4 text-right" dir="rtl">
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-900">
          انتقال به مرحله <strong>{newStage.title}</strong> — قالب مرتبط به‌صورت پیش‌فرض انتخاب شده است.
        </div>

        <div className="flex items-center">
          <input
            id="send-notification-checkbox"
            type="checkbox"
            checked={sendNotification}
            onChange={(e) => setSendNotification(e.target.checked)}
            className="h-4 w-4 text-[var(--color-primary-600)] border-gray-300 rounded"
          />
          <label htmlFor="send-notification-checkbox" className="mr-2 block text-sm font-semibold text-slate-900">
            ارسال پیام اطلاع‌رسانی به متقاضی
          </label>
        </div>

        {sendNotification && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-slate-700">روش ارسال:</span>
                <div className="mt-2 inline-flex rounded-xl shadow-sm w-full overflow-hidden border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCommunicationType('email')}
                    className={`flex-1 inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium transition-colors ${
                      communicationType === 'email' ? 'bg-[var(--color-primary-600)] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <EmailIcon className="h-5 w-5 ml-2" /> ایمیل
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommunicationType('whatsapp')}
                    className={`flex-1 inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium transition-colors ${
                      communicationType === 'whatsapp' ? 'bg-[var(--color-primary-600)] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <WhatsappIcon className="h-5 w-5 ml-2" /> واتساپ
                  </button>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-slate-700">انتخاب قالب:</span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="mt-2 block w-full border border-slate-200 bg-white rounded-xl shadow-sm py-2.5 px-3 text-sm"
                >
                  <option value="" disabled>
                    یک قالب انتخاب کنید...
                  </option>
                  {sortByStage(currentTemplates).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.stageId === newStage.id ? ' ★ این مرحله' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTemplateId ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  متن پیام
                  <span className="text-xs font-normal text-slate-500 mr-2">(قابل ویرایش)</span>
                </label>
                <textarea
                  rows={10}
                  value={standardMessage}
                  onChange={(e) => setStandardMessage(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl shadow-sm py-3 px-3 text-sm leading-7"
                />
              </div>
            ) : (
              <p className="text-sm text-amber-600">هیچ قالبی برای این روش ارسال وجود ندارد. از تنظیمات قالب بسازید.</p>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تغییر مرحله به «${newStage.title}»`} size="large">
      <div className="space-y-6">
        <p className="text-sm text-slate-700">
          در حال انتقال <strong>{candidate.name}</strong> به مرحله <strong>{newStage.title}</strong> هستید.
        </p>

        {isInterviewStage ? renderInterviewOptions() : renderStandardOptions()}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 text-slate-700 py-2.5 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="bg-[var(--color-primary-600)] text-white py-2.5 px-6 rounded-xl hover:bg-[var(--color-primary-700)] transition-colors font-bold text-sm"
          >
            تایید و انتقال
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StageChangeCommunicationModal;
