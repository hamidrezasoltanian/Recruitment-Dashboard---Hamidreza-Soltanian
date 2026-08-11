import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, Comment, StageChangeInfo } from '../../types';
import Modal from '../ui/Modal';
import StarRating from '../ui/StarRating';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../services/dbService';
import { apiService } from '../../services/apiService';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';
import KamaDatePicker from '../ui/KamaDatePicker';
import ProcessTimeline from '../ui/ProcessTimeline';
import { useTemplates } from '../../contexts/TemplateContext';
import { templateService } from '../../services/templateService';
import { EmailIcon, WhatsappIcon } from '../ui/Icons';
import EvaluationForm from '../evaluation/EvaluationForm';
import InterviewEvaluationPanel from '../evaluation/InterviewEvaluationPanel';
import { EvaluationAnswers } from '../../utils/evaluationUtils';

declare const persianDate: any;

interface CandidateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onEdit: (candidate: Candidate) => void;
  onStageChangeRequest: (info: StageChangeInfo) => void;
  onNavigateToTests: (candidateId: string) => void;
  onOpenCommunicationModal: (candidate: Candidate) => void;
  onViewResume: (file: File, candidate: Candidate) => void;
}

interface CandidateTestItemProps {
  candidate: any;
  test: any;
  result: any;
  updateTestResult: (candidateId: string, testId: string, resultData: any) => Promise<void>;
  addToast: (message: string, type: 'success' | 'error') => void;
}

const CandidateTestItem: React.FC<CandidateTestItemProps> = ({ candidate, test, result, updateTestResult, addToast }) => {
  const [status, setStatus] = useState(result?.status || 'not_sent');
  const [score, setScore] = useState(result?.score || '');
  const [notes, setNotes] = useState(result?.notes || '');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string; size: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => {
    setStatus(result?.status || 'not_sent');
    setScore(result?.score || '');
    setNotes(result?.notes || '');
  }, [result]);

  useEffect(() => {
    const loadPreview = async () => {
      if (result?.file) {
        try {
          const fileBlob = await apiService.downloadTestFile(candidate.id, test.id);
          if (fileBlob) {
            const url = URL.createObjectURL(fileBlob);
            setFilePreview(url);
            setUploadedFile({ name: result.file.name, type: result.file.type || '', size: fileBlob.size });
          }
        } catch (e) {
          console.error("Failed to load test file preview", e);
        }
      } else {
        setFilePreview(null);
        setUploadedFile(null);
      }
    };
    loadPreview();
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [result?.file, candidate.id, test.id]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatWhatsAppNumber = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) return '98' + cleaned.substring(1);
    if (cleaned.startsWith('98')) return cleaned;
    if (cleaned.length === 10) return '98' + cleaned;
    return cleaned;
  };

  const handleSendTest = async (platform: 'email' | 'whatsapp' | 'direct') => {
    try {
      if (platform !== 'direct') {
        const body = `سلام ${candidate.name} عزیز،\nلطفاً آزمون ${test.name} را از طریق لینک زیر تکمیل نمایید:\n${test.url}\n\nبا تشکر`;
        
        if (platform === 'email') {
          window.open(`mailto:${candidate.email}?subject=ارسال آزمون ${test.name}&body=${encodeURIComponent(body)}`, '_blank');
        } else if (platform === 'whatsapp') {
          const whatsappNumber = formatWhatsAppNumber(candidate.phone || '');
          if (whatsappNumber) {
            const encodedMessage = encodeURIComponent(body);
            const whatsappUrl1 = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
            const whatsappUrl2 = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;
            const whatsappUrl3 = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
            
            try {
                window.location.href = whatsappUrl2;
            } catch (e) {
                window.open(whatsappUrl1, '_blank');
            }
            setTimeout(() => {
                window.open(whatsappUrl3, '_blank');
            }, 500);
          } else {
            addToast("شماره واتس‌اپ برای این متقاضی ثبت نشده یا نامعتبر است.", "error");
            return;
          }
        }
      }

      await updateTestResult(candidate.id, test.id, {
        status: 'pending',
        sentDate: new Date().toISOString()
      });
      addToast(platform === 'direct' ? `وضعیت آزمون ${test.name} به "در انتظار نتیجه" تغییر یافت.` : `آزمون ${test.name} با موفقیت ارسال شد.`, 'success');
    } catch (err: any) {
      addToast(err.message || 'خطا در ارسال آزمون.', 'error');
    }
  };

  const handleSaveResult = async () => {
    try {
      await updateTestResult(candidate.id, test.id, {
        status,
        score: score !== '' ? Number(score) : undefined,
        notes
      });
      addToast(`نتایج آزمون ${test.name} با موفقیت ذخیره شد.`, 'success');
    } catch (err: any) {
      addToast(err.message || 'خطا در ذخیره نتایج آزمون.', 'error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await apiService.uploadTestFile(candidate.id, test.id, file);
        await updateTestResult(candidate.id, test.id, {
          file: { name: file.name, type: file.type },
          status: 'review'
        });
        // Immediately show local preview without waiting for re-fetch
        const localUrl = URL.createObjectURL(file);
        setFilePreview(localUrl);
        setUploadedFile({ name: file.name, type: file.type, size: file.size });
        addToast(`فایل نتیجه با موفقیت آپلود و وضعیت به "نیاز به بررسی" تغییر یافت.`, 'success');
      } catch (err: any) {
        addToast('خطا در آپلود فایل آزمون: ' + (err.message || ''), 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const statusClasses: Record<string, string> = {
    not_sent: 'bg-gray-100 text-gray-800 border-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    passed: 'bg-green-100 text-green-800 border-green-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
    review: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const statusText: Record<string, string> = {
    not_sent: 'ارسال نشده',
    pending: 'در انتظار نتیجه',
    passed: 'قبول',
    failed: 'مردود',
    review: 'نیاز به بررسی',
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-4 text-right font-sans" dir="rtl">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h4 className="font-bold text-lg text-gray-800">{test.name}</h4>
          {test.url && (
            <a href={test.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1">
              🔗 لینک آزمون: {test.url}
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${statusClasses[status]}`}>
            {statusText[status]}
          </span>
          {status === 'not_sent' && (
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleSendTest('whatsapp')} 
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors shadow-sm flex items-center gap-1"
              >
                <WhatsappIcon className="w-4 h-4" />
                <span>ارسال واتسپ</span>
              </button>
              <button 
                onClick={() => handleSendTest('email')} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors shadow-sm flex items-center gap-1"
              >
                <EmailIcon className="w-4 h-4" />
                <span>ارسال ایمیل</span>
              </button>
              <button 
                onClick={() => handleSendTest('direct')} 
                className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors shadow-sm"
              >
                فقط تغییر وضعیت
              </button>
            </div>
          )}
        </div>
      </div>

      {status !== 'not_sent' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end border-t pt-4 mt-2">
          {/* Status Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">تغییر وضعیت</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="pending">{statusText.pending}</option>
              <option value="passed">{statusText.passed}</option>
              <option value="failed">{statusText.failed}</option>
              <option value="review">{statusText.review}</option>
            </select>
          </div>

          {/* Score Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">نمره آزمون</label>
            <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="مثلا ۸۵" className="w-full border rounded-lg p-2 text-sm bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          {/* File Upload/Download */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">فایل پاسخ / گزارش نتیجه آزمون</label>
            {filePreview && uploadedFile ? (
              <div className="space-y-2">
                {/* File preview card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                  {/* Icon or Image thumbnail */}
                  {uploadedFile.type.startsWith('image/') ? (
                    <img
                      src={filePreview}
                      alt={uploadedFile.name}
                      className="w-14 h-14 object-cover rounded-lg border border-blue-200 shadow-sm flex-shrink-0"
                    />
                  ) : uploadedFile.type === 'application/pdf' ? (
                    <div
                      onClick={() => setShowPdfPreview(!showPdfPreview)}
                      className="w-14 h-14 bg-red-100 border border-red-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-red-200 transition-colors flex-shrink-0"
                      title="کلیک کنید برای پیش‌نمایش PDF"
                    >
                      <span className="text-2xl">📄</span>
                      <span className="text-[9px] font-bold text-red-700">PDF</span>
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📎</span>
                    </div>
                  )}

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate" title={uploadedFile.name}>{uploadedFile.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{formatFileSize(uploadedFile.size)}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <a
                        href={filePreview}
                        download={uploadedFile.name}
                        className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md hover:bg-blue-700 transition-colors font-semibold"
                      >
                        ⬇ دانلود
                      </a>
                      {uploadedFile.type === 'application/pdf' && (
                        <button
                          onClick={() => setShowPdfPreview(!showPdfPreview)}
                          className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-md hover:bg-red-600 transition-colors font-semibold"
                        >
                          {showPdfPreview ? '✕ بستن' : '👁 مشاهده'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Change file */}
                  <label className="text-[10px] text-gray-400 hover:text-blue-600 cursor-pointer font-semibold flex-shrink-0 border border-dashed border-gray-300 hover:border-blue-400 px-2 py-1 rounded-lg transition-colors">
                    تغییر
                    <input type="file" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>

                {/* PDF inline preview */}
                {showPdfPreview && uploadedFile.type === 'application/pdf' && (
                  <div className="rounded-xl overflow-hidden border border-blue-200 shadow-md">
                    <iframe
                      src={filePreview}
                      className="w-full"
                      style={{ height: '320px' }}
                      title="پیش‌نمایش فایل PDF"
                    />
                  </div>
                )}

                {/* Image full preview */}
                {uploadedFile.type.startsWith('image/') && (
                  <div className="rounded-xl overflow-hidden border border-blue-200 shadow-md">
                    <img src={filePreview} alt={uploadedFile.name} className="w-full object-contain max-h-64" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full">
                <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}>
                  <div className="flex flex-col items-center justify-center gap-1">
                    {isUploading ? (
                      <>
                        <span className="text-xl animate-bounce">⬆️</span>
                        <span className="text-[11px] text-blue-600 font-semibold animate-pulse">در حال آپلود فایل...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">📁</span>
                        <span className="text-[11px] text-gray-500 font-semibold">فایل را اینجا بکشید یا کلیک کنید</span>
                        <span className="text-[10px] text-gray-400">PDF، تصویر یا هر فرمت دیگر</span>
                      </>
                    )}
                  </div>
                  <input type="file" onChange={handleFileChange} disabled={isUploading} className="hidden" />
                </label>
              </div>
            )}
          </div>


          {/* Notes Input */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">یادداشت ارزیابی آزمون</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="تحلیل پاسخ‌ها، رفتار متقاضی در تست و..." className="w-full border rounded-lg p-2 text-sm bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button onClick={handleSaveResult} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-6 rounded-lg transition-colors shadow-sm w-full">
              ثبت نتایج
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CandidateDetailsModal: React.FC<CandidateDetailsModalProps> = ({ isOpen, onClose, candidate, onEdit, onStageChangeRequest, onNavigateToTests, onOpenCommunicationModal, onViewResume }) => {
  const { addComment, updateCandidate, addCustomHistoryEntry, deleteCandidate, updateTestResult } = useCandidates();
  const { companyProfile, stages, testLibrary } = useSettings();
  const { templates } = useTemplates();
  const { user, users } = useAuth();
  const { addToast } = useToast();

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
  
  const [newComment, setNewComment] = useState('');
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customHistoryEvent, setCustomHistoryEvent] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'interview' | 'evaluation' | 'tests'>('info');


  const emailReminderTemplate = useMemo(() => {
    return templates.find(t => t.id === 'tpl_email_invite_reminder');
  }, [templates]);
  const whatsappReminderTemplate = useMemo(() => {
    return templates.find(t => t.id === 'tpl_whatsapp_invite_reminder');
  }, [templates]);
  
  useEffect(() => {
    if (isOpen && candidate) {
        setNewComment('');
        setCustomHistoryEvent('');
        setInterviewDate(candidate.interviewDate || '');
        setInterviewTime(candidate.interviewTime || '');
        setInterviewer(candidate.interviewer || '');
        setActiveTab('info');
    }
  }, [isOpen, candidate]);

  if (!candidate) return null;


  const handleSaveEvaluationFromForm = async ({ evaluationJson, historyNote }: { evaluationJson: string; historyNote: string }) => {
    if (!candidate) return;
    try {
      await updateCandidate({
        ...candidate,
        evaluation: evaluationJson
      });
      addToast('ارزیابی متقاضی با موفقیت ذخیره شد.', 'success');
      addCustomHistoryEntry(candidate.id, historyNote);
    } catch {
      addToast('خطا در ذخیره ارزیابی.', 'error');
      throw new Error('save failed');
    }
  };

  const handleAnalyzeResumeForForm = async (): Promise<Partial<EvaluationAnswers> | null> => {
    if (!candidate) return null;
    setIsAnalyzing(true);
    try {
      const updated = await apiService.analyzeResume(candidate.id);
      addToast('رزومه با موفقیت آنالیز شد و فیلدهای اولیه پر شدند.', 'success');
      let partial: Partial<EvaluationAnswers> | null = null;
      if (updated.evaluation) {
        const parsed = JSON.parse(updated.evaluation);
        const ans = parsed.answers || {};
        partial = {
          jobHopping: ans.jobHopping || '',
          relevantExperience: ans.relevantExperience || '',
          resumeAccuracy: ans.resumeAccuracy || '',
          requestedSalary: ans.requestedSalary || '',
        };
      }
      onEdit(updated);
      return partial;
    } catch (err: any) {
      addToast(err.message || 'خطا در آنالیز رزومه.', 'error');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };


  const handleAddComment = () => {
    if (newComment.trim() && user) {
      const comment: Comment = {
        id: `comment_${Date.now()}`,
        user: user.name,
        text: newComment.trim(),
        timestamp: new Date().toISOString(),
      };
      addComment(candidate.id, comment);
      setNewComment('');
    }
  };

  const handleAddCustomHistory = () => {
      if (customHistoryEvent.trim()) {
          addCustomHistoryEntry(candidate.id, customHistoryEvent);
          setCustomHistoryEvent('');
      }
  }

  const handleDeleteCandidate = () => {
    if (window.confirm('آیا از حذف این متقاضی مطمئن هستید؟ این عمل قابل بازگشت نیست.')) {
      deleteCandidate(candidate.id);
      onClose();
    }
  }

  const handleUpdateInterview = () => {
      if (!interviewDate) {
        addToast('لطفا تاریخ را انتخاب کنید.', 'error');
        return;
      }
      if (!interviewer) {
        addToast('لطفا مصاحبه‌کننده را انتخاب کنید.', 'error');
        return;
      }
      updateCandidate({ ...candidate, interviewDate, interviewTime, interviewer });
      addToast('تاریخ مصاحبه ثبت/ویرایش شد.', 'success');
  };
  
  const handleRemoveInterview = () => {
      updateCandidate({ ...candidate, interviewDate: undefined, interviewTime: undefined, interviewer: undefined });
      setInterviewDate('');
      setInterviewTime('');
      setInterviewer('');
      addToast('تاریخ مصاحبه حذف شد.', 'success');
  };
  
  const handleViewResume = async () => {
    if (!candidate.hasResume) return;
    setIsLoadingResume(true);
    try {
        // Try API first (server-stored resumes)
        let blob: Blob | null = null;
        try {
            blob = await apiService.downloadResume(candidate.id);
        } catch {
            // Fallback to localStorage for old resumes
            blob = await dbService.getResume(candidate.id);
        }
        if (blob) {
            const ext = blob.type.includes('pdf') ? '.pdf' : blob.type.includes('word') ? '.docx' : '.pdf';
            const file = new File([blob], `resume${ext}`, { type: blob.type });
            onViewResume(file, candidate);
        } else {
            addToast('فایل رزومه یافت نشد.', 'error');
        }
    } catch(err) {
        addToast('خطا در بارگذاری رزومه.', 'error');
    } finally {
        setIsLoadingResume(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleDateString('fa-IR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleAddToGoogleCalendar = () => {
    if (!interviewDate || !interviewTime) {
      addToast('لطفا ابتدا تاریخ و ساعت مصاحبه را مشخص کنید.', 'error');
      return;
    }
    try {
      const [year, month, day] = interviewDate.split('/').map(Number);
      const [hour, minute] = interviewTime.split(':').map(Number);
      
      const gDate = new Date(year, month - 1, day, hour, minute);
      
      const startTime = new Date(gDate.getTime());
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Assume 1 hour duration
      
      const toGoogleISO = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
      
      const calendarUrl = new URL('https://www.google.com/calendar/render');
      calendarUrl.searchParams.append('action', 'TEMPLATE');
      calendarUrl.searchParams.append('text', `مصاحبه: ${candidate.name} برای ${candidate.position}`);
      calendarUrl.searchParams.append('dates', `${toGoogleISO(startTime)}/${toGoogleISO(endTime)}`);
      calendarUrl.searchParams.append('details', `مصاحبه با ${candidate.name} برای موقعیت شغلی ${candidate.position}.\n\nایمیل: ${candidate.email}\nتلفن: ${candidate.phone}`);
      calendarUrl.searchParams.append('location', companyProfile.address);
      
      window.open(calendarUrl.toString(), '_blank');
    } catch (error) {
        console.error("Error creating Google Calendar link:", error);
        addToast('خطا در ساخت لینک تقویم گوگل. از صحیح بودن فرمت تاریخ و ساعت اطمینان حاصل کنید.', 'error');
    }
  };

  const handleSendReminder = (platform: 'email' | 'whatsapp') => {
    if (!candidate || !interviewDate) {
      addToast('لطفا ابتدا تاریخ مصاحبه را مشخص کنید.', 'error');
      return;
    }
    
    const placeholders = {
        companyName: companyProfile.name,
        companyAddress: companyProfile.address,
        companyWebsite: companyProfile.website,
    };

    if (platform === 'email') {
        if (emailReminderTemplate) {
            const emailMessage = templateService.replacePlaceholders(emailReminderTemplate.content, candidate, placeholders);
            window.open(`mailto:${candidate.email}?subject=یادآوری مصاحبه&body=${encodeURIComponent(emailMessage)}`);
            addToast('یادآور ایمیل آماده ارسال شد.', 'success');
            addCustomHistoryEntry(candidate.id, 'یادآور مصاحبه (ایمیل) ارسال شد');
        } else {
            addToast('قالب ایمیل یادآوری یافت نشد.', 'error');
        }
    } else { // whatsapp
        const whatsappNumber = formatWhatsAppNumber(candidate.phone || '');
        if (whatsappReminderTemplate && whatsappNumber) {
            const whatsappMessage = templateService.replacePlaceholders(whatsappReminderTemplate.content, candidate, placeholders);
            const encodedMessage = encodeURIComponent(whatsappMessage);
            console.log('WhatsApp reminder message:', whatsappMessage);
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
            addToast('یادآور واتسپ آماده ارسال شد.', 'success');
            addCustomHistoryEntry(candidate.id, 'یادآور مصاحبه (واتسپ) ارسال شد');
        } else {
             if (!whatsappReminderTemplate) addToast('قالب واتسپ یادآوری یافت نشد.', 'error');
             if (!whatsappNumber) addToast('شماره واتسپ نامعتبر است.', 'error');
        }
    }
  };


  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`جزئیات متقاضی: ${candidate.name}`} size="xl">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
              {/* Tab Navigation */}
              <div className="flex flex-wrap border-b border-gray-200 gap-1">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 ${
                    activeTab === 'info'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  اطلاعات عمومی و یادداشت‌ها
                </button>
                <button
                  onClick={() => setActiveTab('interview')}
                  className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 ${
                    activeTab === 'interview'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  مصاحبه تخصصی ({candidate.position})
                </button>
                <button
                  onClick={() => setActiveTab('evaluation')}
                  className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 ${
                    activeTab === 'evaluation'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  فرم ارزیابی عمومی
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 ${
                    activeTab === 'tests'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  مدیریت آزمون‌ها
                </button>
              </div>

              {activeTab === 'info' ? (
                <>
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">ایمیل</p>
                      <p className="font-semibold text-gray-900 break-all">{candidate.email}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">تلفن</p>
                      <p className="font-semibold text-gray-900">{candidate.phone}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">منبع</p>
                      <p className="font-semibold text-gray-900">{candidate.source}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">امتیاز</p>
                      <StarRating rating={candidate.rating} readOnly />
                    </div>
                  </div>

                  {/* Interview Management */}
                  <div className="p-6 bg-white rounded-xl border border-gray-200 space-y-4">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">مدیریت مصاحبه</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ مصاحبه</label>
                               <KamaDatePicker value={interviewDate} onChange={setInterviewDate} />
                          </div>
                          <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">ساعت مصاحبه</label>
                               <input type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className="w-full border rounded-lg shadow-sm p-3 text-gray-800 bg-white focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] border-gray-300"/>
                          </div>
                          <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">
                                   مصاحبه‌کننده <span className="text-red-500">*</span>
                               </label>
                               <select 
                                   value={interviewer} 
                                   onChange={e => setInterviewer(e.target.value)} 
                                   className="w-full border rounded-lg shadow-sm p-3 text-gray-800 bg-white focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] border-gray-300"
                               >
                                   <option value="">-- انتخاب مصاحبه‌کننده --</option>
                                   {Object.values(users).map(u => (
                                       <option key={u.username} value={u.username}>{u.name}</option>
                                   ))}
                               </select>
                          </div>
                      </div>
                      <div className="space-y-2 pt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={handleUpdateInterview} className="text-white bg-green-500 hover:bg-green-600 rounded-lg py-2 text-sm">ذخیره تاریخ</button>
                                <button onClick={handleRemoveInterview} className="text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg py-2 text-sm">حذف تاریخ</button>
                            </div>
                            <div className="border-t border-gray-300 my-2"></div>
                            <p className="text-sm font-medium text-center text-gray-600">ارسال یادآور</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleSendReminder('email')} disabled={!interviewDate || !emailReminderTemplate} className="text-white bg-amber-500 hover:bg-amber-600 rounded-lg py-2 text-sm flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    <EmailIcon className="w-5 h-5"/>
                                    <span>ایمیل</span>
                                </button>
                                 <button onClick={() => handleSendReminder('whatsapp')} disabled={!interviewDate || !whatsappReminderTemplate || !candidate.phone} className="text-white bg-teal-500 hover:bg-teal-600 rounded-lg py-2 text-sm flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    <WhatsappIcon className="w-5 h-5"/>
                                    <span>واتسپ</span>
                                </button>
                            </div>
                            <div className="border-t border-gray-300 my-2"></div>
                            <button onClick={handleAddToGoogleCalendar} disabled={!interviewDate || !interviewTime} className="w-full text-white bg-sky-500 hover:bg-sky-600 rounded-lg py-2 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">افزودن به تقویم گوگل</button>
                      </div>
                  </div>

                 {/* Process Timeline */}
                  <div className="p-4 bg-[var(--color-primary-50)] rounded-lg">
                      <h4 className="font-bold text-[var(--color-primary-800)] mb-3">فرآیند استخدام</h4>
                      <ProcessTimeline 
                          stages={stages.filter(s => s.id !== 'archived' && s.id !== 'rejected' && s.id !== 'hired')}
                          candidate={candidate}
                          onStageChangeRequest={onStageChangeRequest}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">برای تغییر مرحله، آیکون متقاضی را روی مرحله مورد نظر بکشید و رها کنید.</p>
                  </div>

                  {/* History */}
                  <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-800 border-b pb-2">تاریخچه</h3>
                      <div className="max-h-40 overflow-y-auto space-y-3 pr-2 border-b pb-2">
                          {candidate.history.map((h, i) => (
                              <div key={i} className="text-sm">
                                  <p className="font-semibold text-gray-700">{h.action} <span className="font-normal text-gray-500">توسط {typeof h.user === 'object' ? (h.user as any)?.name : h.user}</span></p>
                                  <p className="text-xs text-gray-400">{formatTimestamp(h.timestamp)}</p>
                              </div>
                          ))}
                      </div>
                       <div className="flex gap-2">
                          <input type="text" value={customHistoryEvent} onChange={e => setCustomHistoryEvent(e.target.value)} placeholder="افزودن رویداد سفارشی..." className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                          <button onClick={handleAddCustomHistory} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300">ثبت</button>
                       </div>
                  </div>

                  {/* Comments */}
                  <div className="space-y-4">
                       <h3 className="text-lg font-bold text-gray-800 border-b pb-2">یادداشت‌ها</h3>
                       <div className="max-h-40 overflow-y-auto space-y-4 pr-2 border-b pb-2">
                          {candidate.comments.map(c => (
                              <div key={c.id} className="bg-blue-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-800">{c.text}</p>
                                  <p className="text-xs text-gray-500 mt-2">توسط {typeof c.user === 'object' ? (c.user as any)?.name : c.user} در {formatTimestamp(c.timestamp)}</p>
                              </div>
                          ))}
                          {candidate.comments.length === 0 && <p className="text-sm text-gray-500">یادداشتی ثبت نشده است.</p>}
                       </div>
                       <div className="flex gap-2">
                          <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="یادداشت جدید..." className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm" />
                          <button onClick={handleAddComment} className="bg-[var(--color-primary-600)] text-white py-2 px-4 rounded-lg hover:bg-[var(--color-primary-700)]">ثبت</button>
                       </div>
                  </div>
                </>
              ) : activeTab === 'interview' ? (
                <InterviewEvaluationPanel candidate={candidate} />
              ) : activeTab === 'evaluation' ? (
                <EvaluationForm
                  candidate={candidate}
                  user={user}
                  testLibrary={testLibrary}
                  formatTimestamp={formatTimestamp}
                  onSave={handleSaveEvaluationFromForm}
                  onAnalyzeResume={handleAnalyzeResumeForForm}
                  isAnalyzing={isAnalyzing}
                />
              ) : (
                <div className="space-y-6">
                  <div className="bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-xl text-sm text-right" dir="rtl">
                    🎯 <strong>مدیریت آزمون‌های متقاضی:</strong> در این بخش می‌توانید آزمون‌های ارسال شده به متقاضی را مشاهده و نتایج آن‌ها را مدیریت و فایل پاسخ را آپلود کنید.
                  </div>
                  <div className="space-y-4">
                    {testLibrary.length > 0 ? (
                      testLibrary.map((testItem) => {
                        const result = candidate.testResults?.find(r => r.testId === testItem.id);
                        return (
                          <CandidateTestItem
                            key={testItem.id}
                            candidate={candidate}
                            test={testItem}
                            result={result}
                            updateTestResult={updateTestResult}
                            addToast={addToast}
                          />
                        );
                      })
                    ) : (
                      <div className="text-center p-8 bg-gray-50 border rounded-xl text-gray-500 text-sm">
                        هیچ آزمونی در تنظیمات سامانه تعریف نشده است.
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
          
          {/* Sidebar with actions */}
          <div className="xl:col-span-1 space-y-6">
              <div className="p-6 bg-white rounded-xl border border-gray-200 space-y-4">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">اقدامات سریع</h4>
                  <button onClick={() => { onEdit(candidate); onClose(); }} className="w-full text-white bg-blue-600 hover:bg-blue-700 rounded-lg py-3 px-4 transition-colors font-medium">ویرایش کامل اطلاعات</button>
                  <button onClick={() => onNavigateToTests(candidate.id)} className="w-full text-white bg-purple-600 hover:bg-purple-700 rounded-lg py-3 px-4 transition-colors font-medium">مدیریت آزمون‌ها</button>
                  <button onClick={() => onStageChangeRequest({candidate, newStage: stages.find(s=>s.id==='rejected')!})} className="w-full text-white bg-red-600 hover:bg-red-700 rounded-lg py-3 px-4 transition-colors font-medium">رد کردن متقاضی</button>
                  <button onClick={() => onStageChangeRequest({candidate, newStage: stages.find(s=>s.id==='hired')!})} className="w-full text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg py-3 px-4 transition-colors font-medium">استخدام کردن</button>
                   {candidate.hasResume && (
                      <button onClick={handleViewResume} disabled={isLoadingResume} className="w-full text-white bg-green-600 hover:bg-green-700 rounded-lg py-3 px-4 transition-colors font-medium disabled:bg-gray-400">
                          {isLoadingResume ? 'در حال بارگذاری...' : 'مشاهده رزومه'}
                      </button>
                   )}
                   <div className="border-t pt-4 mt-4 space-y-4 border-gray-300">
                      <button onClick={() => onOpenCommunicationModal(candidate)} className="w-full text-white bg-sky-600 hover:bg-sky-700 rounded-lg py-3 px-4 transition-colors flex items-center justify-center gap-3 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                        </svg>
                        <span>ارسال پیام سفارشی</span>
                      </button>
                      <button onClick={handleDeleteCandidate} className="w-full text-white bg-red-700 hover:bg-red-800 rounded-lg py-3 px-4 transition-colors flex items-center justify-center gap-3 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>حذف متقاضی</span>
                      </button>
                   </div>
              </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CandidateDetailsModal;