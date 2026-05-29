import React, { useState, useEffect, useRef } from 'react';
import { Candidate, StageId } from '../../types';
import { DEFAULT_SOURCES } from '../../constants';
import Modal from '../ui/Modal';
import StarRating from '../ui/StarRating';
import { useSettings } from '../../contexts/SettingsContext';
import PersianDatePicker from '../ui/PersianDatePicker';

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
    };
    onSave(newCandidate, resumeFile);
    onClose();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setResumeFile(e.target.files[0]);
      }
  };

  const handleDateChange = (date: string) => {
    setInterviewDate(date);
  };

  const fieldClass = 'mt-1 block w-full border border-gray-200 bg-gray-50 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:border-transparent focus:bg-white transition-all';
  const labelClass = 'block text-xs font-semibold text-gray-500 mb-1';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={candidateToEdit ? 'ویرایش متقاضی' : 'افزودن متقاضی'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className={labelClass}>نام کامل</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={fieldClass} />
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
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className={fieldClass} dir="ltr" />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>شماره تلفن</label>
            <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className={fieldClass} dir="ltr" />
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
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>تاریخ مصاحبه</label>
              <PersianDatePicker value={interviewDate} onChange={handleDateChange} />
            </div>
            <div>
              <label htmlFor="interviewTime" className={labelClass}>ساعت مصاحبه</label>
              <input type="time" id="interviewTime" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className={fieldClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>رزومه</label>
            <input ref={resumeInputRef} type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="mt-1 text-sm text-gray-500 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary-50)] file:text-[var(--color-primary-700)] hover:file:bg-[var(--color-primary-100)]" />
            {candidateToEdit?.hasResume && !resumeFile && <p className="text-xs text-emerald-600 mt-1">رزومه قبلاً آپلود شده است.</p>}
          </div>
          <div>
            <label className={labelClass}>امتیاز</label>
            <div className="mt-2"><StarRating rating={rating} onRatingChange={setRating} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">انصراف</button>
          <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all" style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))' }}>ذخیره</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditCandidateModal;
