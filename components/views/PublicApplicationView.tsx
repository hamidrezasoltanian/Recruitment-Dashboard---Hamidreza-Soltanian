import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { Candidate } from '../../types';
import { DEFAULT_SOURCES } from '../../constants';

declare const persianDate: any;

const PublicApplicationView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [source, setSource] = useState('سایت شرکت');
  const [resumeFile, setResumeFile] = useState<File | undefined>();
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobPositions, setJobPositions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('recruitment_company_profile_v1') || '{}');
      if (profile.name) setCompanyName(profile.name);
      if (profile.jobPositions?.length) {
        const titles = profile.jobPositions.map((j: any) => j.title);
        setJobPositions(titles);
        setPosition(titles[0] || '');
      }
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const candidate: Candidate = {
        id: `pub_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        position: position.trim(),
        source,
        stage: 'inbox',
        rating: 0,
        createdAt: new Date().toISOString(),
        stageEnteredAt: new Date().toISOString(),
        history: [{ user: 'فرم عمومی', action: 'درخواست از طریق فرم آنلاین ثبت شد', timestamp: new Date().toISOString() }],
        comments: message.trim() ? [{ id: `cm_${Date.now()}`, user: 'متقاضی', text: message.trim(), timestamp: new Date().toISOString() }] : [],
        hasResume: !!resumeFile,
      };
      await dbService.saveCandidate(candidate);
      if (resumeFile) await dbService.saveResume(candidate.id, resumeFile);
      setSubmitted(true);
    } catch (err: any) {
      setError('خطا در ثبت درخواست. لطفا دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'block w-full px-4 py-3 text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:border-transparent focus:bg-white transition-all text-sm';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1.5';

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-900) 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-4 space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">درخواست شما ثبت شد!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            از ارسال درخواست شما متشکریم. تیم ما به زودی با شما تماس خواهد گرفت.
          </p>
          <button
            onClick={() => { setSubmitted(false); setName(''); setEmail(''); setPhone(''); setMessage(''); setResumeFile(undefined); }}
            className="text-sm text-[var(--color-primary-600)] font-semibold hover:underline"
          >
            ارسال درخواست جدید
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-900) 100%)' }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-white">{companyName || 'فرم استخدام'}</h1>
          <p className="text-white/70 text-sm mt-1">فرم درخواست همکاری</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>نام کامل *</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="نام و نام خانوادگی" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>ایمیل *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className={inputClass} dir="ltr" />
              </div>
              <div>
                <label className={labelClass}>تلفن *</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="09..." className={inputClass} dir="ltr" />
              </div>
            </div>
            {jobPositions.length > 0 ? (
              <div>
                <label className={labelClass}>موقعیت شغلی *</label>
                <select required value={position} onChange={e => setPosition(e.target.value)} className={inputClass}>
                  <option value="" disabled>انتخاب کنید...</option>
                  {jobPositions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className={labelClass}>موقعیت شغلی مورد نظر *</label>
                <input type="text" required value={position} onChange={e => setPosition(e.target.value)} placeholder="موقعیت شغلی" className={inputClass} />
              </div>
            )}
            <div>
              <label className={labelClass}>چطور با ما آشنا شدید؟</label>
              <select value={source} onChange={e => setSource(e.target.value)} className={inputClass}>
                {DEFAULT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>رزومه (PDF، Word)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => setResumeFile(e.target.files?.[0])}
                className="mt-1 text-sm text-gray-500 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary-50)] file:text-[var(--color-primary-700)] hover:file:bg-[var(--color-primary-100)]"
              />
            </div>
            <div>
              <label className={labelClass}>توضیحات (اختیاری)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="معرفی کوتاه از خودتان یا توضیحات اضافی..."
                className={inputClass}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  در حال ثبت...
                </span>
              ) : 'ارسال درخواست'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicApplicationView;
