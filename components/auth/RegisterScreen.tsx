import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'create' | 'join';

const RegisterScreen: React.FC = () => {
  const { registerCompany, joinCompany, setAuthScreen } = useAuth();
  const [mode, setMode] = useState<Mode>('create');
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('رمز عبور و تکرار آن مطابقت ندارند.'); return; }
    if (password.length < 6)  { setError('رمز عبور باید حداقل ۶ کاراکتر باشد.'); return; }

    setLoading(true);
    try {
      if (mode === 'create') {
        await registerCompany(companyName.trim(), userName.trim(), email.trim(), password);
      } else {
        await joinCompany(companyId.trim(), userName.trim(), email.trim(), password);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'خطایی رخ داد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'block w-full px-4 py-3 text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:border-transparent focus:bg-white transition-all text-sm';

  const labelClass = 'block text-xs font-semibold text-gray-500 mb-1.5 mr-1';

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-900) 100%)' }}>
        <div className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">ثبت‌نام موفق!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            حساب کاربری شما ایجاد شد. اگر تأیید ایمیل فعال باشد، ابتدا ایمیل خود را تأیید کنید سپس وارد شوید.
          </p>
          <button
            onClick={() => setAuthScreen('login')}
            className="w-full py-3 text-sm font-bold text-white rounded-xl"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))' }}
          >
            رفتن به صفحه ورود
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-8" style={{ background: 'linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-900) 100%)' }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <h1 className="text-xl font-extrabold text-white">داشبورد استخدام</h1>
          <p className="text-white/60 text-sm mt-1">ثبت‌نام و ایجاد حساب</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${mode === 'create' ? 'bg-white shadow-sm text-[var(--color-primary-700)]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              شرکت جدید
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${mode === 'join' ? 'bg-white shadow-sm text-[var(--color-primary-700)]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              پیوستن به شرکت
            </button>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {mode === 'create' ? (
              <div>
                <label className={labelClass}>نام شرکت</label>
                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="شرکت فناوری نمونه" className={inputClass} />
              </div>
            ) : (
              <div>
                <label className={labelClass}>شناسه شرکت (Company ID)</label>
                <input type="text" required value={companyId} onChange={e => setCompanyId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={`${inputClass} font-mono text-xs`} dir="ltr" />
                <p className="mt-1 text-xs text-gray-400 mr-1">این شناسه را از مدیر سیستم دریافت کنید.</p>
              </div>
            )}

            <div>
              <label className={labelClass}>نام و نام خانوادگی</label>
              <input type="text" required value={userName} onChange={e => setUserName(e.target.value)} placeholder="علی رضایی" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ایمیل</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={inputClass} dir="ltr" />
            </div>
            <div>
              <label className={labelClass}>رمز عبور</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" className={inputClass} dir="ltr" />
            </div>
            <div>
              <label className={labelClass}>تکرار رمز عبور</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className={inputClass} dir="ltr" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  در حال پردازش...
                </span>
              ) : mode === 'create' ? 'ایجاد شرکت و حساب کاربری' : 'پیوستن به شرکت'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 pt-1">
            قبلاً حساب دارید؟{' '}
            <button onClick={() => setAuthScreen('login')} className="text-[var(--color-primary-600)] font-semibold hover:underline">
              ورود
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
