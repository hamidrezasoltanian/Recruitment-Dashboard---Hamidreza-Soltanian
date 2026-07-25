import React, { useState, useEffect, useRef } from 'react';
import { Candidate, StageId } from '../../types';
import { DEFAULT_SOURCES } from '../../constants';
import Modal from '../ui/Modal';
import StarRating from '../ui/StarRating';
import { useSettings } from '../../contexts/SettingsContext';
import KamaDatePicker from '../ui/KamaDatePicker';
import { parseJobVisionProfile } from '../../utils/profileParser';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

interface AddEditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (candidate: Candidate, resumeFile?: File) => void;
  candidateToEdit?: Candidate | null;
  initialStage?: StageId;
}

const fieldClass =
  'mt-1.5 block w-full border border-slate-200 bg-white rounded-xl shadow-sm py-2.5 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all';

const labelClass = 'block text-sm font-semibold text-slate-700';

const AddEditCandidateModal: React.FC<AddEditCandidateModalProps> = ({ isOpen, onClose, onSave, candidateToEdit, initialStage }) => {
  const { sources, companyProfile, stages } = useSettings();
  const { users } = useAuth();
  const availableSources = sources.length > 0 ? sources : DEFAULT_SOURCES;
  const kanbanStages = stages.filter(s => s.id !== 'archived');
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [source, setSource] = useState(availableSources[0]);
  const [stage, setStage] = useState<StageId>('inbox');
  const [rating, setRating] = useState(0);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [resumeFile, setResumeFile] = useState<File | undefined>();
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [evaluation, setEvaluation] = useState<string | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const AUTO_SAVE_KEY = 'candidate_form_draft';
  const AUTO_SAVE_INTERVAL = 2000;

  useEffect(() => {
    if (!isOpen) return;

    const formData = {
      name, email, phone, position, source, stage, rating,
      interviewDate, interviewTime, interviewer,
      isEdit: !!candidateToEdit,
      timestamp: Date.now()
    };

    const saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form draft:', error);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearTimeout(saveTimer);
  }, [name, email, phone, position, source, stage, rating, interviewDate, interviewTime, interviewer, isOpen, candidateToEdit]);

  useEffect(() => {
    if (!isOpen) return;

    try {
      const savedDraft = localStorage.getItem(AUTO_SAVE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        const draftAge = Date.now() - (draft.timestamp || 0);
        if (draftAge < 3600000 && !candidateToEdit) {
          const shouldRestore = window.confirm('یک پیش‌نویس ذخیره شده از فرم قبلی پیدا شد. آیا می‌خواهید آن را بازیابی کنید؟');
          if (shouldRestore) {
            setName(draft.name || '');
            setEmail(draft.email || '');
            setPhone(draft.phone || '');
            setPosition(draft.position || (companyProfile.jobPositions.length > 0 ? companyProfile.jobPositions[0].title : ''));
            setSource(draft.source || availableSources[0]);
            setStage(draft.stage || initialStage || 'inbox');
            setRating(draft.rating || 0);
            setInterviewDate(draft.interviewDate || '');
            setInterviewTime(draft.interviewTime || '');
            setInterviewer(draft.interviewer || '');
          } else {
            localStorage.removeItem(AUTO_SAVE_KEY);
          }
        }
      }
    } catch (error) {
      console.error('Error loading form draft:', error);
    }
  }, [isOpen, candidateToEdit, availableSources, companyProfile, initialStage]);

  useEffect(() => {
    if (candidateToEdit) {
      setName(candidateToEdit.name);
      setEmail(candidateToEdit.email);
      setPhone(candidateToEdit.phone);
      setPosition(candidateToEdit.position);
      setSource(candidateToEdit.source);
      setStage(candidateToEdit.stage);
      setRating(candidateToEdit.rating);
      setInterviewDate(candidateToEdit.interviewDate || '');
      setInterviewTime(candidateToEdit.interviewTime || '');
      setInterviewer(candidateToEdit.interviewer || '');
      setEvaluation(candidateToEdit.evaluation || undefined);
      localStorage.removeItem(AUTO_SAVE_KEY);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setPosition(companyProfile.jobPositions.length > 0 ? companyProfile.jobPositions[0].title : '');
      setSource(availableSources[0]);
      setStage(initialStage || 'inbox');
      setRating(0);
      setInterviewDate('');
      setInterviewTime('');
      setInterviewer('');
      setEvaluation(undefined);
    }
    setResumeFile(undefined);
    setShowImport(false);
    setImportText('');
    setImportMsg('');
    if (resumeInputRef.current) {
      resumeInputRef.current.value = '';
    }
  }, [candidateToEdit, initialStage, isOpen, availableSources, companyProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interviewDate && !interviewer) {
      alert('لطفاً فرد مصاحبه‌کننده را برای این مصاحبه انتخاب کنید.');
      return;
    }
    const newCandidate: Candidate = {
      id: candidateToEdit?.id || `cand_${Date.now()}`,
      createdAt: candidateToEdit?.createdAt || new Date().toISOString(),
      history: candidateToEdit?.history || [],
      comments: candidateToEdit?.comments || [],
      ...candidateToEdit,
      name, email, phone, position, source, stage, rating,
      interviewDate: interviewDate || undefined,
      interviewTime: interviewTime || undefined,
      interviewer: interviewer || undefined,
      hasResume: !!resumeFile || candidateToEdit?.hasResume,
      evaluation: evaluation,
    };
    localStorage.removeItem(AUTO_SAVE_KEY);
    onSave(newCandidate, resumeFile);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);

      setIsAnalyzing(true);
      try {
        const data = await apiService.analyzeTempResume(file);

        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);

        if (data.name) {
          setSource('جاب ویژن');
        }

        const initialEvalAnswers = {
          jobHopping: data.jobHopping || '',
          relevantExperience: data.relevantExperience || '',
          resumeAccuracy: 'عالی',
          requestedSalary: data.requestedSalary || '',
          phoneEnergy: 0,
          phoneRoutine: '',
          phoneScenario: '',
          phoneResult: '',
          discDominant: [],
          supportFit: '',
          starHonesty: 0,
          starHonestyExample: '',
          starStress: 0,
          starTeamwork: 0,
          rolePlayAccuracy: '',
          rolePlaySpeed: '',
          referenceCheck: '',
          finalDecision: '',
          finalNotes: ''
        };

        const newEval = {
          evaluatorName: 'سیستم (آنالیز خودکار)',
          evaluatorUsername: 'system',
          candidateName: data.name || 'متقاضی جدید',
          updatedAt: new Date().toISOString(),
          answers: initialEvalAnswers
        };

        setEvaluation(JSON.stringify(newEval));
      } catch (err: any) {
        console.error(err);
        alert('خطا در آنالیز رزومه: ' + (err.message || 'خطای نامشخص'));
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleDateChange = (date: string) => {
    setInterviewDate(date);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const parsed = parseJobVisionProfile(importText);
    let filled = 0;
    if (parsed.name) { setName(parsed.name); filled++; }
    if (parsed.email) { setEmail(parsed.email); filled++; }
    if (parsed.phone) { setPhone(parsed.phone); filled++; }
    if (parsed.position) { setPosition(parsed.position); filled++; }
    if (filled > 0) {
      setImportMsg(`${filled} فیلد استخراج شد. لطفاً بررسی و تکمیل کنید.`);
      setSource('جاب ویژن');
    } else {
      setImportMsg('اطلاعاتی شناسایی نشد. متن را بیشتر کپی کنید.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={candidateToEdit ? 'ویرایش متقاضی' : 'افزودن متقاضی'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {!candidateToEdit && (
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-l from-sky-50/90 to-blue-50/50 overflow-hidden">
            <button
              type="button"
              onClick={() => { setShowImport(v => !v); setImportMsg(''); }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-100/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </span>
                استخراج اطلاعات از جاب‌ویژن
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showImport ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showImport && (
              <div className="px-4 pb-4">
                <p className="text-xs text-sky-700/80 mb-2 leading-relaxed">
                  در صفحه پروفایل جاب‌ویژن، <strong>Ctrl+A</strong> سپس <strong>Ctrl+C</strong> بزنید و اینجا paste کنید:
                </p>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="متن صفحه را اینجا Paste کنید..."
                  rows={5}
                  className="w-full text-sm border border-sky-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-sky-300/50 bg-white"
                />
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={handleImport}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
                  >
                    استخراج اطلاعات
                  </button>
                  {importMsg && <p className="text-xs text-slate-600">{importMsg}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name" className={labelClass}>نام کامل</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={fieldClass} placeholder="نام و نام خانوادگی" />
          </div>
          <div>
            <label htmlFor="position" className={labelClass}>موقعیت شغلی</label>
            <select id="position" value={position} onChange={e => setPosition(e.target.value)} required className={fieldClass}>
              <option value="" disabled>یک موقعیت انتخاب کنید</option>
              {companyProfile.jobPositions.map(job => (
                <option key={job.id} value={job.title}>{job.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>ایمیل</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className={fieldClass} placeholder="email@example.com" />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>شماره تلفن</label>
            <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className={fieldClass} placeholder="09123456789" dir="ltr" />
          </div>
          <div>
            <label htmlFor="source" className={labelClass}>منبع</label>
            <select id="source" value={source} onChange={e => setSource(e.target.value)} className={fieldClass}>
              {availableSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="stage" className={labelClass}>مرحله</label>
            <select id="stage" value={stage} onChange={e => setStage(e.target.value as StageId)} className={fieldClass}>
              {kanbanStages.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-bold text-slate-500 mb-3 tracking-wide">زمان‌بندی مصاحبه</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>تاریخ مصاحبه</label>
                <div className="mt-1.5">
                  <KamaDatePicker value={interviewDate} onChange={handleDateChange} />
                </div>
              </div>
              <div>
                <label htmlFor="interviewTime" className={labelClass}>ساعت مصاحبه</label>
                <input type="time" id="interviewTime" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="interviewer" className={labelClass}>
                  مصاحبه‌کننده {interviewDate && <span className="text-red-500">*</span>}
                </label>
                <select
                  id="interviewer"
                  value={interviewer}
                  onChange={e => setInterviewer(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">-- انتخاب مصاحبه‌کننده --</option>
                  {Object.values(users).map(u => (
                    <option key={u.username} value={u.username}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
            <label className={labelClass}>رزومه</label>
            <input
              ref={resumeInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              disabled={isAnalyzing}
              className="mt-2 block w-full text-sm text-slate-500 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary-50)] file:text-[var(--color-primary-700)] hover:file:bg-[var(--color-primary-100)] disabled:opacity-50 cursor-pointer"
            />
            {isAnalyzing && (
              <p className="text-xs text-sky-600 mt-2 font-medium animate-pulse">
                در حال آنالیز رزومه و استخراج هوشمند اطلاعات...
              </p>
            )}
            {resumeFile && !isAnalyzing && (
              <p className="text-xs text-emerald-600 mt-2 font-medium truncate">فایل انتخاب‌شده: {resumeFile.name}</p>
            )}
            {candidateToEdit?.hasResume && !resumeFile && (
              <p className="text-xs text-emerald-600 mt-2">رزومه قبلاً آپلود شده است.</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col justify-center">
            <label className={`${labelClass} mb-2`}>امتیاز</label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => {
              localStorage.removeItem(AUTO_SAVE_KEY);
              onClose();
            }}
            className="bg-slate-100 text-slate-700 py-2.5 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="bg-[var(--color-primary-600)] text-white py-2.5 px-7 rounded-xl hover:bg-[var(--color-primary-700)] transition-colors font-bold text-sm shadow-sm shadow-blue-600/20 disabled:opacity-50"
          >
            {isAnalyzing ? 'در حال پردازش...' : 'ذخیره'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditCandidateModal;
