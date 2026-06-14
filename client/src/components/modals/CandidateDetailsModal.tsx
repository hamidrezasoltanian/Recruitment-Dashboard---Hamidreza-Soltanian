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

declare const persianDate: any;

interface CandidateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onEdit: (candidate: Candidate) => void;
  onStageChangeRequest: (info: StageChangeInfo) => void;
  onNavigateToTests: (candidateId: string) => void;
  onOpenCommunicationModal: (candidate: Candidate) => void;
  onViewResume: (file: File) => void;
}

const CandidateDetailsModal: React.FC<CandidateDetailsModalProps> = ({ isOpen, onClose, candidate, onEdit, onStageChangeRequest, onNavigateToTests, onOpenCommunicationModal, onViewResume }) => {
  const { addComment, updateCandidate, addCustomHistoryEntry, deleteCandidate } = useCandidates();
  const { companyProfile, stages } = useSettings();
  const { templates } = useTemplates();
  const { user } = useAuth();
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
  const [customHistoryEvent, setCustomHistoryEvent] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'evaluation'>('info');

  // Evaluation Form State
  const [jobHopping, setJobHopping] = useState('');
  const [relevantExperience, setRelevantExperience] = useState('');
  const [resumeAccuracy, setResumeAccuracy] = useState('');
  const [phoneEnergy, setPhoneEnergy] = useState(0);
  const [phoneRoutine, setPhoneRoutine] = useState('');
  const [phoneScenario, setPhoneScenario] = useState('');
  const [requestedSalary, setRequestedSalary] = useState('');
  const [phoneResult, setPhoneResult] = useState('');
  const [discDominant, setDiscDominant] = useState<string[]>([]);
  const [supportFit, setSupportFit] = useState('');
  const [starHonesty, setStarHonesty] = useState(0);
  const [starHonestyExample, setStarHonestyExample] = useState('');
  const [starStress, setStarStress] = useState(0);
  const [starTeamwork, setStarTeamwork] = useState(0);
  const [rolePlayAccuracy, setRolePlayAccuracy] = useState('');
  const [rolePlaySpeed, setRolePlaySpeed] = useState('');
  const [referenceCheck, setReferenceCheck] = useState('');
  const [finalDecision, setFinalDecision] = useState('');
  const [finalNotes, setFinalNotes] = useState('');

  const parsedEvaluation = useMemo(() => {
    if (!candidate?.evaluation) return null;
    try {
      return JSON.parse(candidate.evaluation);
    } catch {
      return null;
    }
  }, [candidate?.evaluation]);

  const resetEvaluationFields = () => {
    setJobHopping('');
    setRelevantExperience('');
    setResumeAccuracy('');
    setPhoneEnergy(0);
    setPhoneRoutine('');
    setPhoneScenario('');
    setRequestedSalary('');
    setPhoneResult('');
    setDiscDominant([]);
    setSupportFit('');
    setStarHonesty(0);
    setStarHonestyExample('');
    setStarStress(0);
    setStarTeamwork(0);
    setRolePlayAccuracy('');
    setRolePlaySpeed('');
    setReferenceCheck('');
    setFinalDecision('');
    setFinalNotes('');
  };

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
        setActiveTab('info');

        // Populate evaluation
        if (candidate.evaluation) {
          try {
            const parsed = JSON.parse(candidate.evaluation);
            const ans = parsed.answers || {};
            setJobHopping(ans.jobHopping || '');
            setRelevantExperience(ans.relevantExperience || '');
            setResumeAccuracy(ans.resumeAccuracy || '');
            setPhoneEnergy(Number(ans.phoneEnergy) || 0);
            setPhoneRoutine(ans.phoneRoutine || '');
            setPhoneScenario(ans.phoneScenario || '');
            setRequestedSalary(ans.requestedSalary || '');
            setPhoneResult(ans.phoneResult || '');
            setDiscDominant(ans.discDominant || []);
            setSupportFit(ans.supportFit || '');
            setStarHonesty(Number(ans.starHonesty) || 0);
            setStarHonestyExample(ans.starHonestyExample || '');
            setStarStress(Number(ans.starStress) || 0);
            setStarTeamwork(Number(ans.starTeamwork) || 0);
            setRolePlayAccuracy(ans.rolePlayAccuracy || '');
            setRolePlaySpeed(ans.rolePlaySpeed || '');
            setReferenceCheck(ans.referenceCheck || '');
            setFinalDecision(ans.finalDecision || '');
            setFinalNotes(ans.finalNotes || '');
          } catch {
            resetEvaluationFields();
          }
        } else {
          resetEvaluationFields();
        }
    }
  }, [isOpen, candidate]);

  if (!candidate) return null;

  const handleSaveEvaluation = async () => {
    if (!candidate || !user) return;
    const evaluationData = {
      evaluatorName: user.name,
      evaluatorUsername: user.username,
      candidateName: candidate.name,
      updatedAt: new Date().toISOString(),
      answers: {
        jobHopping,
        relevantExperience,
        resumeAccuracy,
        phoneEnergy,
        phoneRoutine,
        phoneScenario,
        requestedSalary,
        phoneResult,
        discDominant,
        supportFit,
        starHonesty,
        starHonestyExample,
        starStress,
        starTeamwork,
        rolePlayAccuracy,
        rolePlaySpeed,
        referenceCheck,
        finalDecision,
        finalNotes,
      }
    };

    try {
      await updateCandidate({
        ...candidate,
        evaluation: JSON.stringify(evaluationData)
      });
      addToast('ارزیابی متقاضی با موفقیت ذخیره شد.', 'success');
      addCustomHistoryEntry(candidate.id, `ارزیابی متقاضی ثبت/ویرایش شد (توسط ${user.name})`);
    } catch {
      addToast('خطا در ذخیره ارزیابی.', 'error');
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
      updateCandidate({ ...candidate, interviewDate, interviewTime });
      addToast('تاریخ مصاحبه ثبت/ویرایش شد.', 'success');
  };
  
  const handleRemoveInterview = () => {
      updateCandidate({ ...candidate, interviewDate: undefined, interviewTime: undefined });
      setInterviewDate('');
      setInterviewTime('');
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
            onViewResume(file);
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
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`pb-3 px-6 font-bold text-sm transition-colors border-b-2 ${
                    activeTab === 'info'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  اطلاعات عمومی و یادداشت‌ها
                </button>
                <button
                  onClick={() => setActiveTab('evaluation')}
                  className={`pb-3 px-6 font-bold text-sm transition-colors border-b-2 ${
                    activeTab === 'evaluation'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  فرم ارزیابی اختصاصی متقاضی
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ مصاحبه</label>
                               <KamaDatePicker value={interviewDate} onChange={setInterviewDate} />
                          </div>
                          <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">ساعت مصاحبه</label>
                               <input type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className="w-full border rounded-lg shadow-sm p-3 text-gray-800 bg-white focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] border-gray-300"/>
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
              ) : (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 text-sm">
                    <div>
                      👤 <strong>متقاضی مصاحبه:</strong> <span className="text-blue-900 font-semibold">{candidate.name}</span> ({candidate.position})
                    </div>
                    <div>
                      📝 <strong>کاربر ثبت‌کننده ارزیابی:</strong> <span className="text-blue-900 font-semibold">{user?.name}</span>
                    </div>
                    {parsedEvaluation && (
                      <div className="text-xs text-gray-500">
                        آخرین ویرایش: توسط {parsedEvaluation.evaluatorName} در {formatTimestamp(parsedEvaluation.updatedAt)}
                      </div>
                    )}
                  </div>

                  {/* SECTION 1: Pre-Screening */}
                  <div className="p-5 border border-gray-200 rounded-xl bg-white space-y-4">
                    <h3 className="text-md font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                      <span>بخش اول: ارزیابی اولیه رزومه (Pre-Screening)</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Job Hopping */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">وضعیت ثبات شغلی (Job Hopping):</label>
                        <div className="space-y-2">
                          {[
                            { value: 'hopping_red', label: 'جابجایی‌های مکرر (کمتر از ۱ سال در ۳ شرکت اخیر) 🔴 (رد خودکار)' },
                            { value: 'hopping_yellow', label: 'ثبات متوسط (۱ تا ۳ سال ماندگاری) 🟡' },
                            { value: 'hopping_green', label: 'ثبات بالا (بیش از ۳ سال ماندگاری) 🟢' }
                          ].map(opt => (
                            <label key={opt.value} className="flex items-start gap-3 cursor-pointer text-sm font-medium text-gray-700">
                              <input type="radio" name="jobHopping" value={opt.value} checked={jobHopping === opt.value} onChange={e => setJobHopping(e.target.value)} className="mt-1" />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Relevant Experience */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">سابقه کار مرتبط در امور مشتریان B2B یا کار با سیستم:</label>
                        <select value={relevantExperience} onChange={e => setRelevantExperience(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">-- انتخاب کنید --</option>
                          <option value="exp_red">بدون سابقه مرتبط / فقط فروش میدانی 🔴</option>
                          <option value="exp_yellow">۱ تا ۳ سال 🟡</option>
                          <option value="exp_green">بیشتر از ۳ سال 🟢</option>
                        </select>
                      </div>

                      {/* Resume Accuracy */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">دقت ظاهری رزومه (نداشتن غلط املایی و نظم):</label>
                        <div className="flex gap-6">
                          {['ضعیف', 'متوسط', 'عالی'].map(val => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                              <input type="radio" name="resumeAccuracy" value={val} checked={resumeAccuracy === val} onChange={e => setResumeAccuracy(e.target.value)} />
                              <span>{val}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Phone Interview */}
                  <div className="p-5 border border-gray-200 rounded-xl bg-white space-y-4">
                    <h3 className="text-md font-bold text-gray-800 border-b pb-2">
                      <span>بخش دوم: ارزیابی مصاحبه تلفنی (Phone Interview)</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Phone Voice / Energy */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">انرژی، فن بیان و لحن صدا پشت تلفن:</label>
                        <StarRating rating={phoneEnergy} onRatingChange={setPhoneEnergy} />
                      </div>

                      {/* Requested Salary */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">میزان حقوق درخواستی کاندیدا (تومان):</label>
                        <input type="text" value={requestedSalary} onChange={e => setRequestedSalary(e.target.value)} placeholder="مثلا ۵,۰۰۰,۰۰۰" className="w-full border rounded-lg p-2.5 bg-white border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>

                      {/* Phone Routine */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">شرح روتین کاری گذشته (آیا به کار با سیستم و پیگیری اشاره کرد؟):</label>
                        <textarea rows={3} value={phoneRoutine} onChange={e => setPhoneRoutine(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="توضیحات..." />
                      </div>

                      {/* Phone Scenario */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">واکنش به سناریوی فرضی مشتری عصبانی بابت تاخیر ارسال کالا:</label>
                        <div className="space-y-2">
                          {[
                            { value: 'scen_red', label: 'تدافعی، استرسی یا حق‌به‌جانب 🔴' },
                            { value: 'scen_yellow', label: 'متوسط (تلاش برای آرام کردن اما بدون راهکار) 🟡' },
                            { value: 'scen_green', label: 'حرفه‌ای، صبور و راه‌حل‌محور 🟢' }
                          ].map(opt => (
                            <label key={opt.value} className="flex items-start gap-3 cursor-pointer text-sm font-medium text-gray-700">
                              <input type="radio" name="phoneScenario" value={opt.value} checked={phoneScenario === opt.value} onChange={e => setPhoneScenario(e.target.value)} className="mt-1" />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Phone Result */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">نتیجه مصاحبه تلفنی:</label>
                        <div className="flex flex-wrap gap-6">
                          {[
                            { value: 'reject', label: 'رد 🔴' },
                            { value: 'invite_test', label: 'دعوت به مصاحبه حضوری و ارسال تست 🟢' }
                          ].map(opt => (
                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                              <input type="radio" name="phoneResult" value={opt.value} checked={phoneResult === opt.value} onChange={e => setPhoneResult(e.target.value)} />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: DISC Analysis */}
                  <div className="p-5 border border-gray-200 rounded-xl bg-white space-y-4">
                    <h3 className="text-md font-bold text-gray-800 border-b pb-2">
                      <span>بخش سوم: تحلیل رفتارشناسی (DISC)</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* DISC Type */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 font-medium">تیپ شخصیتی غالب تست DISC:</label>
                        <div className="flex gap-4">
                          {['D', 'I', 'S', 'C'].map(type => {
                            const isChecked = discDominant.includes(type);
                            return (
                              <label key={type} className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-800 bg-gray-50 px-3 py-1.5 border rounded-lg">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked} 
                                  onChange={() => {
                                    if (isChecked) {
                                      setDiscDominant(prev => prev.filter(t => t !== type));
                                    } else {
                                      setDiscDominant(prev => [...prev, type]);
                                    }
                                  }} 
                                />
                                <span>{type}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Support Job Fit */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">میزان انطباق با نقش پشتیبانی (نیاز به دقت و صبر):</label>
                        <select value={supportFit} onChange={e => setSupportFit(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">-- انتخاب کنید --</option>
                          <option value="fit_green">انطباق بالا (ترکیب S و C) 🟢</option>
                          <option value="fit_yellow">انطباق متوسط 🟡</option>
                          <option value="fit_red">پرریسک (D یا I بسیار بالا) 🔴</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: STAR Method & Role-Play */}
                  <div className="p-5 border border-gray-200 rounded-xl bg-white space-y-4">
                    <h3 className="text-md font-bold text-gray-800 border-b pb-2">
                      <span>بخش چهارم: ارزیابی حضوری (STAR Method & Role-Play)</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Star Honesty */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">سنجش صداقت و دقت (مثال از خطای کاری گذشته):</label>
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                          <StarRating rating={starHonesty} onRatingChange={setStarHonesty} />
                          <input 
                            type="text" 
                            value={starHonestyExample} 
                            onChange={e => setStarHonestyExample(e.target.value)} 
                            placeholder="مثال ذکر شده..." 
                            className="flex-grow border rounded-lg p-2 bg-white border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          />
                        </div>
                      </div>

                      {/* Star Stress */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">سنجش مدیریت استرس در فشردگی کارها:</label>
                        <StarRating rating={starStress} onRatingChange={setStarStress} />
                      </div>

                      {/* Star Teamwork */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">سنجش کار تیمی (حل تعارض با ویزیتورها و تیم فروش):</label>
                        <StarRating rating={starTeamwork} onRatingChange={setStarTeamwork} />
                      </div>

                      {/* Role Play Details */}
                      <div className="space-y-2 md:col-span-2 border-t pt-4">
                        <label className="block text-sm font-bold text-gray-800 mb-2">نتیجه تست عملی (رول‌پلی بررسی کاتالوگ و ثبت سفارش):</label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <span className="block text-sm font-semibold text-gray-700">دقت در ثبت جزئیات فنی:</span>
                            <div className="flex gap-4">
                              {['ضعیف', 'دارای خطای جزئی', 'بدون نقص'].map(val => (
                                <label key={val} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                  <input type="radio" name="rolePlayAccuracy" value={val} checked={rolePlayAccuracy === val} onChange={e => setRolePlayAccuracy(e.target.value)} />
                                  <span>{val}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="block text-sm font-semibold text-gray-700">سرعت انتقال اطلاعات به سیستم:</span>
                            <div className="flex gap-4">
                              {['کند', 'متوسط', 'سریع'].map(val => (
                                <label key={val} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                  <input type="radio" name="rolePlaySpeed" value={val} checked={rolePlaySpeed === val} onChange={e => setRolePlaySpeed(e.target.value)} />
                                  <span>{val}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5: Summary */}
                  <div className="p-5 border border-gray-200 rounded-xl bg-white space-y-4">
                    <h3 className="text-md font-bold text-gray-800 border-b pb-2">
                      <span>بخش پنجم: جمع‌بندی نهایی</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Reference Check */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">استعلام از محل کار قبلی (Reference Check) انجام شد؟</label>
                        <div className="space-y-2">
                          {[
                            { value: 'yes_confirmed', label: 'بله، تایید شد' },
                            { value: 'no_check', label: 'خیر' },
                            { value: 'negative_feedback', label: 'انجام شد اما نظرات منفی بود' }
                          ].map(opt => (
                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                              <input type="radio" name="referenceCheck" value={opt.value} checked={referenceCheck === opt.value} onChange={e => setReferenceCheck(e.target.value)} />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Final Decision */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">تصمیم نهایی تیم مصاحبه‌کننده:</label>
                        <select value={finalDecision} onChange={e => setFinalDecision(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">-- انتخاب کنید --</option>
                          <option value="offer">استخدام قطعی (Offer)</option>
                          <option value="standby">لیست ذخیره (Standby)</option>
                          <option value="reject">رد قطعی (Reject)</option>
                        </select>
                      </div>

                      {/* Final Notes */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">یادداشت و تحلیل نهایی مدیر ارزیاب:</label>
                        <textarea rows={4} value={finalNotes} onChange={e => setFinalNotes(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="تحلیل نهایی خود را بنویسید..." />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-4 border-t gap-3">
                    <button onClick={handleSaveEvaluation} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm shadow-md transition-all">
                      ثبت نهایی ارزیابی
                    </button>
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