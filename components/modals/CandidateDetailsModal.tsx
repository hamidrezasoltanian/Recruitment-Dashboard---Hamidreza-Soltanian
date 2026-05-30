import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, Comment, StageChangeInfo, ScorecardEntry, ScorecardScore } from '../../types';
import Modal from '../ui/Modal';
import StarRating from '../ui/StarRating';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../services/dbService';
import { localApiFiles } from '../../services/localApiService';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';
import PersianDatePicker from '../ui/PersianDatePicker';
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
  const { addComment, updateCandidate, addCustomHistoryEntry, updateScorecard } = useCandidates();
  const { companyProfile, stages, scorecardTemplates } = useSettings();
  const { templates } = useTemplates();
  const { user, authMode } = useAuth();
  const { addToast } = useToast();
  
  const [newComment, setNewComment] = useState('');
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [customHistoryEvent, setCustomHistoryEvent] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [scorecardScores, setScorecardScores] = useState<ScorecardScore[]>([]);
  const [scorecardNotes, setScorecardNotes] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'scorecard'>('info');

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
      setActiveDetailTab('info');
      // Load existing scorecard for current stage
      const existing = candidate.scorecards?.find(s => s.stageId === candidate.stage);
      setScorecardScores(existing?.scores || []);
      setScorecardNotes(existing?.notes || '');
    }
  }, [isOpen, candidate]);

  if (!candidate) return null;

  const currentStageCriteria = scorecardTemplates[candidate.stage] || [];

  const handleScorecardScoreChange = (criteriaId: string, score: number) => {
    setScorecardScores(prev => {
      const existing = prev.find(s => s.criteriaId === criteriaId);
      if (existing) return prev.map(s => s.criteriaId === criteriaId ? { ...s, score } : s);
      return [...prev, { criteriaId, score }];
    });
  };

  const handleSaveScorecard = () => {
    if (!user) return;
    const entry: ScorecardEntry = {
      stageId: candidate.stage,
      scores: scorecardScores,
      notes: scorecardNotes,
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: user.name,
    };
    updateScorecard(candidate.id, entry);
    addToast('کارت امتیازدهی ذخیره شد.', 'success');
  };

  const getScorecardTotal = () => {
    if (currentStageCriteria.length === 0 || scorecardScores.length === 0) return null;
    let totalWeight = 0, weightedScore = 0;
    currentStageCriteria.forEach(c => {
      const s = scorecardScores.find(sc => sc.criteriaId === c.id);
      if (s) {
        weightedScore += (s.score / 5) * c.weight;
        totalWeight += c.weight;
      }
    });
    return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : null;
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
        const file = authMode === 'server'
            ? await localApiFiles.getResume(candidate.id)
            : await dbService.getResume(candidate.id);
        if (file) {
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
    return new persianDate(date).format('dddd D MMMM YYYY ساعت HH:mm');
  };
  
  const handleAddToGoogleCalendar = () => {
    if (!interviewDate || !interviewTime) {
      addToast('لطفا ابتدا تاریخ و ساعت مصاحبه را مشخص کنید.', 'error');
      return;
    }
    try {
      const [year, month, day] = interviewDate.split('/').map(Number);
      const [hour, minute] = interviewTime.split(':').map(Number);
      
      const pDate = new persianDate([year, month, day]).hour(hour).minute(minute);
      const gDate = pDate.toDate();
      
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
        const whatsappNumber = candidate.phone ? candidate.phone.replace(/[^0-9]/g, '').replace(/^0/, '98') : '';
        if (whatsappReminderTemplate && whatsappNumber) {
            const whatsappMessage = templateService.replacePlaceholders(whatsappReminderTemplate.content, candidate, placeholders);
            window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
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
      <Modal isOpen={isOpen} onClose={onClose} title={`جزئیات متقاضی: ${candidate.name}`}>
        {/* Tab Navigation inside modal */}
        {currentStageCriteria.length > 0 && (
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveDetailTab('info')}
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === 'info' ? 'border-[var(--color-primary-500)] text-[var(--color-primary-600)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >اطلاعات و مدیریت</button>
            <button
              onClick={() => setActiveDetailTab('scorecard')}
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === 'scorecard' ? 'border-[var(--color-primary-500)] text-[var(--color-primary-600)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              کارت امتیازدهی
              {getScorecardTotal() !== null && (
                <span className="mr-2 px-2 py-0.5 bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-xs rounded-full font-bold">
                  {getScorecardTotal()}٪
                </span>
              )}
            </button>
          </div>
        )}

        {/* Scorecard Tab */}
        {activeDetailTab === 'scorecard' && currentStageCriteria.length > 0 && (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">ارزیابی متقاضی در مرحله «{stages.find(s => s.id === candidate.stage)?.title}»</p>
            {currentStageCriteria.map(criteria => {
              const currentScore = scorecardScores.find(s => s.criteriaId === criteria.id)?.score || 0;
              return (
                <div key={criteria.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">{criteria.name}</span>
                    <span className="text-xs text-gray-400">وزن: {criteria.weight}٪</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => handleScorecardScoreChange(criteria.id, n)}
                        className={`scorecard-score-btn ${currentScore === n ? 'active' : ''}`}
                      >
                        {n}
                      </button>
                    ))}
                    {currentScore > 0 && (
                      <span className="text-xs text-gray-500 self-center mr-2">
                        {['', 'ضعیف', 'متوسط', 'خوب', 'عالی', 'فوق‌العاده'][currentScore]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت ارزیاب</label>
              <textarea
                value={scorecardNotes}
                onChange={e => setScorecardNotes(e.target.value)}
                rows={3}
                placeholder="نکات مهم ارزیابی..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
              />
            </div>
            {getScorecardTotal() !== null && (
              <div className="p-4 bg-[var(--color-primary-50)] rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">امتیاز کل (وزن‌دار)</p>
                <p className="text-4xl font-extrabold text-[var(--color-primary-600)]">{getScorecardTotal()}٪</p>
              </div>
            )}
            <button
              onClick={handleSaveScorecard}
              className="w-full bg-[var(--color-primary-600)] text-white py-2 rounded-lg hover:bg-[var(--color-primary-700)] font-medium"
            >
              ذخیره ارزیابی
            </button>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${activeDetailTab === 'scorecard' && currentStageCriteria.length > 0 ? 'hidden' : ''}`}>
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-100 rounded-lg">
                <div><p className="text-sm text-gray-500">ایمیل</p><p className="font-medium truncate">{candidate.email}</p></div>
                <div><p className="text-sm text-gray-500">تلفن</p><p className="font-medium">{candidate.phone}</p></div>
                <div><p className="text-sm text-gray-500">منبع</p><p className="font-medium">{candidate.source}</p></div>
                <div className="col-span-2 md:col-span-3"><p className="text-sm text-gray-500">امتیاز</p><StarRating rating={candidate.rating} readOnly /></div>
              </div>

              {/* Interview Management */}
              <div className="p-4 bg-gray-100 rounded-lg space-y-3">
                  <h4 className="font-bold text-gray-800 mb-2">مدیریت مصاحبه</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ مصاحبه</label>
                           <PersianDatePicker value={interviewDate} onChange={setInterviewDate} />
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
                              <p className="font-semibold text-gray-700">{h.action} <span className="font-normal text-gray-500">توسط {h.user}</span></p>
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
                              <p className="text-xs text-gray-500 mt-2">توسط {c.user} در {formatTimestamp(c.timestamp)}</p>
                          </div>
                      ))}
                      {candidate.comments.length === 0 && <p className="text-sm text-gray-500">یادداشتی ثبت نشده است.</p>}
                   </div>
                   <div className="flex gap-2">
                      <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="یادداشت جدید..." className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm" />
                      <button onClick={handleAddComment} className="bg-[var(--color-primary-600)] text-white py-2 px-4 rounded-lg hover:bg-[var(--color-primary-700)]">ثبت</button>
                   </div>
              </div>
          </div>
          
          {/* Sidebar with actions */}
          <div className="lg:col-span-1 space-y-4">
              <div className="p-4 bg-gray-100 rounded-lg space-y-3">
                  <h4 className="font-bold text-gray-800 mb-2">اقدامات سریع</h4>
                  <button onClick={() => { onEdit(candidate); onClose(); }} className="w-full text-white bg-blue-600 hover:bg-blue-700 rounded-lg py-2 transition-colors">ویرایش کامل اطلاعات</button>
                  <button onClick={() => onNavigateToTests(candidate.id)} className="w-full text-white bg-purple-600 hover:bg-purple-700 rounded-lg py-2 transition-colors">مدیریت آزمون‌ها</button>
                  <button onClick={() => onStageChangeRequest({candidate, newStage: stages.find(s=>s.id==='rejected')!})} className="w-full text-white bg-red-600 hover:bg-red-700 rounded-lg py-2 transition-colors">رد کردن متقاضی</button>
                  <button onClick={() => onStageChangeRequest({candidate, newStage: stages.find(s=>s.id==='hired')!})} className="w-full text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg py-2 transition-colors">استخدام کردن</button>
                   {candidate.hasResume && (
                      <button onClick={handleViewResume} disabled={isLoadingResume} className="w-full text-white bg-green-600 hover:bg-green-700 rounded-lg py-2 transition-colors disabled:bg-gray-400">
                          {isLoadingResume ? 'در حال بارگذاری...' : 'مشاهده رزومه'}
                      </button>
                   )}
                   <div className="border-t pt-3 mt-3 space-y-3 border-gray-300">
                      <button onClick={() => onOpenCommunicationModal(candidate)} className="w-full text-white bg-sky-600 hover:bg-sky-700 rounded-lg py-2 transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                        </svg>
                        <span>ارسال پیام سفارشی</span>
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