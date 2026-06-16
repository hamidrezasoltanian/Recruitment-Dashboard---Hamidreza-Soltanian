import React, { useState, useEffect, useRef } from 'react';
import { Candidate, StageId } from '../../types';
import { DEFAULT_SOURCES } from '../../constants';
import Modal from '../ui/Modal';
import StarRating from '../ui/StarRating';
import { useSettings } from '../../contexts/SettingsContext';
import KamaDatePicker from '../ui/KamaDatePicker';
import { parseJobVisionProfile } from '../../utils/profileParser';
import { apiService } from '../../services/apiService';

interface AddEditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (candidate: Candidate, resumeFile?: File) => void;
  candidateToEdit?: Candidate | null;
  initialStage?: StageId;
}

const AddEditCandidateModal: React.FC<AddEditCandidateModalProps> = ({ isOpen, onClose, onSave, candidateToEdit, initialStage }) => {
  const { sources, companyProfile, stages } = useSettings();
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
  const [resumeFile, setResumeFile] = useState<File | undefined>();
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [evaluation, setEvaluation] = useState<string | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const AUTO_SAVE_KEY = 'candidate_form_draft';
  const AUTO_SAVE_INTERVAL = 2000; // 2 seconds

  // Auto-save form data to localStorage
  useEffect(() => {
    if (!isOpen) return;

    const formData = {
      name,
      email,
      phone,
      position,
      source,
      stage,
      rating,
      interviewDate,
      interviewTime,
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
  }, [name, email, phone, position, source, stage, rating, interviewDate, interviewTime, isOpen, candidateToEdit]);

  // Load draft data from localStorage when modal opens
  useEffect(() => {
    if (!isOpen) return;

    try {
      const savedDraft = localStorage.getItem(AUTO_SAVE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        // Only restore if draft is recent (less than 1 hour old) and not editing existing candidate
        const draftAge = Date.now() - (draft.timestamp || 0);
        if (draftAge < 3600000 && !candidateToEdit) {
          // Ask user if they want to restore draft
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
      setEvaluation(candidateToEdit.evaluation || undefined);
      // Clear draft when editing existing candidate
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
      setEvaluation(undefined);
    }
    setResumeFile(undefined);
    if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
    }
  }, [candidateToEdit, initialStage, isOpen, availableSources, companyProfile]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCandidate: Candidate = {
      id: candidateToEdit?.id || `cand_${Date.now()}`,
      createdAt: candidateToEdit?.createdAt || new Date().toISOString(),
      history: candidateToEdit?.history || [],
      comments: candidateToEdit?.comments || [],
      ...candidateToEdit,
      name, email, phone, position, source, stage, rating,
      interviewDate: interviewDate || undefined,
      interviewTime: interviewTime || undefined,
      hasResume: !!resumeFile || candidateToEdit?.hasResume,
      evaluation: evaluation,
    };
    // Clear draft after successful save
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
      setImportMsg(`✅ ${filled} فیلد استخراج شد. لطفاً بررسی و تکمیل کنید.`);
    } else {
      setImportMsg('⚠️ اطلاعاتی شناسایی نشد. متن رو بیشتر کپی کنید.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={candidateToEdit ? 'ویرایش متقاضی' : 'افزودن متقاضی'}>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* JobVision Import Panel */}
        {!candidateToEdit && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 overflow-hidden">
            <button
              type="button"
              onClick={() => { setShowImport(v => !v); setImportMsg(''); }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100/60 transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                استخراج اطلاعات از جاب‌ویژن
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showImport ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showImport && (
              <div className="px-4 pb-4">
                <p className="text-xs text-blue-600 mb-2">
                  در صفحه پروفایل جاب‌ویژن، <strong>Ctrl+A</strong> سپس <strong>Ctrl+C</strong> بزنید و اینجا paste کنید:
                </p>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="متن صفحه را اینجا Paste کنید..."
                  rows={5}
                  className="w-full text-xs border border-blue-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleImport}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    استخراج اطلاعات
                  </button>
                  {importMsg && <p className="text-xs text-gray-600">{importMsg}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form fields */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">نام کامل</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm" />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700">موقعیت شغلی</label>
            <select id="position" value={position} onChange={e => setPosition(e.target.value)} required className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm">
                <option value="" disabled>یک موقعیت انتخاب کنید</option>
                {companyProfile.jobPositions.map(job => (
                    <option key={job.id} value={job.title}>{job.title}</option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">ایمیل</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">شماره تلفن</label>
            <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm" />
          </div>
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">منبع</label>
            <select id="source" value={source} onChange={e => setSource(e.target.value)} className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm">
              {availableSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-gray-700">مرحله</label>
            <select id="stage" value={stage} onChange={e => setStage(e.target.value as StageId)} className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm">
              {kanbanStages.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
           <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ مصاحبه</label>
                  <KamaDatePicker value={interviewDate} onChange={handleDateChange} />
              </div>
              <div>
                  <label htmlFor="interviewTime" className="block text-sm font-medium text-gray-700 mb-1">ساعت مصاحبه</label>
                  <input type="time" id="interviewTime" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-3 focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm" />
              </div>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700">رزومه</label>
              <input ref={resumeInputRef} type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" disabled={isAnalyzing} className="mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary-50)] file:text-[var(--color-primary-700)] hover:file:bg-[var(--color-primary-100)] disabled:opacity-50"/>
              {isAnalyzing && <p className="text-xs text-blue-600 mt-1 animate-pulse">در حال آنالیز رزومه و استخراج هوشمند اطلاعات...</p>}
              {candidateToEdit?.hasResume && !resumeFile && <p className="text-xs text-green-600 mt-1">رزومه قبلا آپلود شده است.</p>}
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">امتیاز</label>
              <StarRating rating={rating} onRatingChange={setRating} />
           </div>
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" disabled={isAnalyzing} onClick={() => {
            // Clear draft when canceling
            localStorage.removeItem(AUTO_SAVE_KEY);
            onClose();
          }} className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50">انصراف</button>
          <button type="submit" disabled={isAnalyzing} className="bg-[var(--color-primary-600)] text-white py-2 px-6 rounded-lg hover:bg-[var(--color-primary-700)] transition-colors disabled:opacity-50">
             {isAnalyzing ? 'در حال پردازش...' : 'ذخیره'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditCandidateModal;
