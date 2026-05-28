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
    'block w-full px-3 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm';

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-gray-800">ثبت‌نام موفق</h2>
          <p className="text-gray-600 text-sm">
            حساب کاربری شما ایجاد شد.
            {' '}اگر Supabase تأیید ایمیل را فعال کرده باشد، لطفاً ایمیل خود را تأیید کنید، سپس وارد شوید.
          </p>
          <button
            onClick={() => setAuthScreen('login')}
            className="w-full py-3 text-sm font-medium text-white bg-[var(--color-primary-600)] rounded-md hover:bg-[var(--color-primary-700)]"
          >
            رفتن به صفحه ورود
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-extrabold text-center text-gray-900">ایجاد حساب کاربری</h2>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 font-medium transition-colors ${mode === 'create' ? 'bg-[var(--color-primary-600)] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            ایجاد شرکت جدید
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 font-medium transition-colors ${mode === 'join' ? 'bg-[var(--color-primary-600)] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            پیوستن به شرکت موجود
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'create' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام شرکت *</label>
              <input
                type="text" required value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="شرکت فناوری نمونه"
                className={inputClass}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شناسه شرکت (Company ID) *</label>
              <input
                type="text" required value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={`${inputClass} font-mono text-xs`}
                dir="ltr"
              />
              <p className="mt-1 text-xs text-gray-500">این شناسه را از مدیر سیستم دریافت کنید.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی *</label>
            <input
              type="text" required value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="علی رضایی"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل *</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputClass}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور *</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="حداقل ۶ کاراکتر"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تکرار رمز عبور *</label>
            <input
              type="password" required value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="تکرار رمز عبور"
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-medium text-white bg-[var(--color-primary-600)] rounded-md hover:bg-[var(--color-primary-700)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'در حال پردازش...' : mode === 'create' ? 'ایجاد شرکت و حساب کاربری' : 'پیوستن به شرکت'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          قبلاً حساب دارید؟{' '}
          <button onClick={() => setAuthScreen('login')} className="text-[var(--color-primary-600)] font-medium hover:underline">
            ورود
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
