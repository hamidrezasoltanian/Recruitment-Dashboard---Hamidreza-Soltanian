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

  // Helper function to format phone number for WhatsApp
  const formatWhatsAppNumber = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      return '98' + cleaned.substring(1);
    } else if (cleaned.startsWith('98')) {
      return cleaned;
    } else if (cleaned.length === 10) {
      return '98' + cleaned;
    }
    return cleaned;
  };

  // States for template selection
  const emailTemplates = useMemo(() => templates.filter(t => t.type === 'email'), [templates]);
  const whatsappTemplates = useMemo(() => templates.filter(t => t.type === 'whatsapp'), [templates]);

  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('');
  const [selectedWhatsappTemplateId, setSelectedWhatsappTemplateId] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(true);

  // States for non-interview stages
  const [sendNotification, setSendNotification] = useState(true);
  const [communicationType, setCommunicationType] = useState<'email' | 'whatsapp'>('email');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const isInterviewStage = useMemo(() => newStage.id.startsWith('interview-'), [newStage.id]);

  useEffect(() => {
    if (isOpen) {
      // Find matching stage template or general/first email template
      const defaultEmailTpl = templates.find(t => t.stageId === newStage.id && t.type === 'email') || 
                             templates.find(t => !t.stageId && t.type === 'email') || 
                             templates.find(t => t.type === 'email');
      setSelectedEmailTemplateId(defaultEmailTpl?.id || '');

      // Find matching stage template or general/first whatsapp template
      const defaultWhatsappTpl = templates.find(t => t.stageId === newStage.id && t.type === 'whatsapp') || 
                                templates.find(t => !t.stageId && t.type === 'whatsapp') || 
                                templates.find(t => t.type === 'whatsapp');
      setSelectedWhatsappTemplateId(defaultWhatsappTpl?.id || '');

      // Set defaults for checkboxes
      setSendEmail(!!templates.find(t => t.stageId === newStage.id && t.type === 'email'));
      setSendWhatsapp(!!templates.find(t => t.stageId === newStage.id && t.type === 'whatsapp'));

      // Standard stage defaults
      const defaultStandardTpl = templates.find(t => t.stageId === newStage.id && t.type === communicationType) || 
                                 templates.find(t => !t.stageId && t.type === communicationType) || 
                                 templates.find(t => t.type === communicationType);
      setSelectedTemplateId(defaultStandardTpl?.id || '');
      setSendNotification(!!defaultStandardTpl);
    }
  }, [isOpen, newStage.id, templates, communicationType]);

  const handleConfirm = () => {
    let notificationsSent = false;
    // FIX: Destructure companyProfile to exclude 'jobPositions' which is not a string and causes a type error.
    const { jobPositions, ...companyDetails } = companyProfile;
    
    if (isInterviewStage) {
      const emailTemplate = templates.find(t => t.id === selectedEmailTemplateId);
      const whatsappTemplate = templates.find(t => t.id === selectedWhatsappTemplateId);

      if (sendEmail && emailTemplate) {
        const message = templateService.replacePlaceholders(emailTemplate.content, candidate, { stageName: newStage.title, ...companyDetails });
        window.open(`mailto:${candidate.email}?subject=اطلاع رسانی فرآیند استخدام&body=${encodeURIComponent(message)}`, '_blank');
        notificationsSent = true;
      }
      if (sendWhatsapp && whatsappTemplate) {
        const whatsappNumber = formatWhatsAppNumber(candidate.phone || '');
        if (whatsappNumber) {
          const message = templateService.replacePlaceholders(whatsappTemplate.content, candidate, { stageName: newStage.title, ...companyDetails });
          const encodedMessage = encodeURIComponent(message);
          console.log('WhatsApp message:', message);
          console.log('Encoded message:', encodedMessage);
          console.log('WhatsApp URL:', `https://wa.me/${whatsappNumber}?text=${encodedMessage}`);
          
          // Try different WhatsApp URL formats for mobile app
          const whatsappUrl1 = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
          const whatsappUrl2 = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;
          const whatsappUrl3 = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
          
          console.log('WhatsApp URL 1 (wa.me):', whatsappUrl1);
          console.log('WhatsApp URL 2 (whatsapp://):', whatsappUrl2);
          console.log('WhatsApp URL 3 (api.whatsapp.com):', whatsappUrl3);
          
          // Method 1: Try whatsapp:// protocol first (for mobile app)
          try {
              window.location.href = whatsappUrl2;
          } catch (e) {
              console.log('whatsapp:// failed, trying wa.me');
              // Method 2: Fallback to wa.me
              window.open(whatsappUrl1, '_blank');
          }
          
          // Method 3: Also try api.whatsapp.com as backup
          setTimeout(() => {
              window.open(whatsappUrl3, '_blank');
          }, 500);
          notificationsSent = true;
        } else {
          addToast("ارسال واتسپ ناموفق: شماره تلفن نامعتبر است.", "error");
        }
      }
      if (notificationsSent) addToast(`پیام‌های اطلاع‌رسانی برای ${candidate.name} آماده ارسال شدند.`, 'success');

    } else if (sendNotification) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (!template) {
        addToast('قالب پیام یافت نشد.', 'error');
        return;
      }
      const message = templateService.replacePlaceholders(template.content, candidate, { stageName: newStage.title, ...companyDetails });

      if (communicationType === 'email') {
        window.open(`mailto:${candidate.email}?subject=اطلاع رسانی فرآیند استخدام&body=${encodeURIComponent(message)}`, '_blank');
        addToast(`ایمیل اطلاع‌رسانی برای ${candidate.name} آماده ارسال شد.`, 'success');
      } else {
        const whatsappNumber = formatWhatsAppNumber(candidate.phone || '');
        if (whatsappNumber) {
          const encodedMessage = encodeURIComponent(message);
          console.log('WhatsApp message:', message);
          console.log('Encoded message:', encodedMessage);
          console.log('WhatsApp URL:', `https://wa.me/${whatsappNumber}?text=${encodedMessage}`);
          
          // Try different WhatsApp URL formats for mobile app
          const whatsappUrl1 = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
          const whatsappUrl2 = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;
          const whatsappUrl3 = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
          
          console.log('WhatsApp URL 1 (wa.me):', whatsappUrl1);
          console.log('WhatsApp URL 2 (whatsapp://):', whatsappUrl2);
          console.log('WhatsApp URL 3 (api.whatsapp.com):', whatsappUrl3);
          
          // Method 1: Try whatsapp:// protocol first (for mobile app)
          try {
              window.location.href = whatsappUrl2;
          } catch (e) {
              console.log('whatsapp:// failed, trying wa.me');
              // Method 2: Fallback to wa.me
              window.open(whatsappUrl1, '_blank');
          }
          
          // Method 3: Also try api.whatsapp.com as backup
          setTimeout(() => {
              window.open(whatsappUrl3, '_blank');
          }, 500);
          addToast(`پیام واتسپ برای ${candidate.name} آماده ارسال شد.`, 'success');
        } else {
          addToast("شماره واتس‌اپ برای این متقاضی ثبت نشده.", "error");
          return;
        }
      }
    }
    
    onConfirm();
  };

  const renderInterviewOptions = () => {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-md border text-right font-sans" dir="rtl">
          <p className="font-bold text-gray-800 mb-3">ارسال پیام اطلاع رسانی به متقاضی:</p>
          <div className="space-y-4">
              <div className="space-y-2">
                  <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                      <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="h-4 w-4 text-[var(--color-primary-600)] border-gray-300 rounded" />
                      <span className="font-bold text-sm text-gray-700">ارسال ایمیل دعوت به مصاحبه</span>
                  </label>
                  {sendEmail && (
                      <select 
                        value={selectedEmailTemplateId} 
                        onChange={e => setSelectedEmailTemplateId(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-[var(--color-primary-500)]"
                      >
                          <option value="">-- بدون قالب (خالی) --</option>
                          {emailTemplates.map(t => (
                              <option key={t.id} value={t.id}>
                                  {t.name} {t.stageId === newStage.id ? '⭐ (مخصوص این مرحله)' : ''}
                              </option>
                          ))}
                      </select>
                  )}
              </div>

              <div className="space-y-2">
                  <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                      <input type="checkbox" checked={sendWhatsapp} onChange={e => setSendWhatsapp(e.target.checked)} className="h-4 w-4 text-[var(--color-primary-600)] border-gray-300 rounded" />
                      <span className="font-bold text-sm text-gray-700">ارسال پیام واتسپ دعوت به مصاحبه</span>
                  </label>
                  {sendWhatsapp && (
                      <select 
                        value={selectedWhatsappTemplateId} 
                        onChange={e => setSelectedWhatsappTemplateId(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-[var(--color-primary-500)]"
                      >
                          <option value="">-- بدون قالب (خالی) --</option>
                          {whatsappTemplates.map(t => (
                              <option key={t.id} value={t.id}>
                                  {t.name} {t.stageId === newStage.id ? '⭐ (مخصوص این مرحله)' : ''}
                              </option>
                          ))}
                      </select>
                  )}
              </div>
          </div>
      </div>
    );
  };

  const renderStandardOptions = () => {
    const relevantTemplate = templates.find(t => t.id === selectedTemplateId);
    // FIX: Destructure companyProfile to exclude 'jobPositions' which is not a string and causes a type error.
    const { jobPositions, ...companyDetails } = companyProfile;
    const message = relevantTemplate ? templateService.replacePlaceholders(relevantTemplate.content, candidate, { stageName: newStage.title, ...companyDetails }) : '';
    
    const currentTemplates = communicationType === 'email' ? emailTemplates : whatsappTemplates;

    return (
      <div className="space-y-4 text-right font-sans" dir="rtl">
        <div className="flex items-center">
          <input id="send-notification-checkbox" type="checkbox" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} className="h-4 w-4 text-[var(--color-primary-600)] border-gray-300 rounded" />
          <label htmlFor="send-notification-checkbox" className="mr-2 block text-sm font-semibold text-gray-900">ارسال پیام اطلاع‌رسانی به متقاضی</label>
        </div>

        {sendNotification && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">روش ارسال:</span>
                <div className="mt-2 inline-flex rounded-md shadow-sm w-full">
                  <button 
                    type="button" 
                    onClick={() => setCommunicationType('email')} 
                    className={`flex-1 relative inline-flex justify-center items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium transition-colors ${communicationType === 'email' ? 'bg-[var(--color-primary-600)] text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <EmailIcon className="h-5 w-5 ml-2" /> ایمیل
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setCommunicationType('whatsapp')} 
                    className={`flex-1 -ml-px relative inline-flex justify-center items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium transition-colors ${communicationType === 'whatsapp' ? 'bg-[var(--color-primary-600)] text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <WhatsappIcon className="h-5 w-5 ml-2" /> واتسپ
                  </button>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">انتخاب قالب:</span>
                <select 
                  value={selectedTemplateId} 
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  className="mt-2 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-[var(--color-primary-500)]"
                >
                  <option value="" disabled>یک قالب انتخاب کنید...</option>
                  {currentTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.stageId === newStage.id ? '⭐ (مخصوص این مرحله)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {relevantTemplate ? (
              <textarea id="message-preview" rows={8} value={message} readOnly className="mt-2 block w-full border border-gray-200 bg-gray-50 rounded-md shadow-sm py-2 px-3 text-sm" />
            ) : (
              <p className="text-sm text-amber-600 mt-2">هیچ قالبی برای این روش ارسال وجود ندارد یا انتخاب نشده است. می‌توانید در تنظیمات قالب بسازید.</p>
            )}
          </>
        )}
      </div>
    );
  };

  const title = `تغییر مرحله به "${newStage.title}"`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p>شما در حال انتقال متقاضی <strong className="font-bold">{candidate.name}</strong> به مرحله <strong className="font-bold">{newStage.title}</strong> هستید.</p>
        
        {isInterviewStage ? renderInterviewOptions() : renderStandardOptions()}

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">انصراف</button>
          <button type="button" onClick={handleConfirm} className="bg-[var(--color-primary-600)] text-white py-2 px-6 rounded-lg hover:bg-[var(--color-primary-700)] transition-colors">
            تایید و انتقال
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StageChangeCommunicationModal;
