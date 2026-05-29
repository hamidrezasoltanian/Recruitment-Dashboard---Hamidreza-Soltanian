import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseEnabled } from '../../services/supabaseClient';

const LoginScreen: React.FC = () => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, setAuthScreen } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(credential, password);
    } catch (err: any) {
      setError(err.message || 'خطایی رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'block w-full px-4 py-3 text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:border-transparent focus:bg-white transition-all text-sm';

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-900) 100%)' }}>
      <div className="w-full max-w-sm mx-4">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white">داشبورد استخدام</h1>
          <p className="text-white/60 text-sm mt-1">مدیریت فرآیند جذب نیرو</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-800 text-center">ورود به حساب</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 mr-1">
                {isSupabaseEnabled ? 'ایمیل' : 'نام کاربری'}
              </label>
              <input
                type={isSupabaseEnabled ? 'email' : 'text'}
                autoComplete={isSupabaseEnabled ? 'email' : 'username'}
                required
                className={inputClass}
                placeholder={isSupabaseEnabled ? 'you@company.com' : 'admin'}
                value={credential}
                onChange={e => setCredential(e.target.value)}
                dir={isSupabaseEnabled ? 'ltr' : 'rtl'}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 mr-1">رمز عبور</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                dir="ltr"
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
                  در حال ورود...
                </span>
              ) : 'ورود'}
            </button>
          </form>

          {isSupabaseEnabled ? (
            <p className="text-sm text-center text-gray-500">
              حساب کاربری ندارید؟{' '}
              <button onClick={() => setAuthScreen('register')} className="text-[var(--color-primary-600)] font-semibold hover:underline">
                ثبت‌نام
              </button>
            </p>
          ) : (
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 text-center space-y-1">
              <p className="font-semibold text-gray-600">اطلاعات ورود (حالت محلی)</p>
              <p>ادمین: <code className="bg-gray-200 px-1 rounded">admin</code> / <code className="bg-gray-200 px-1 rounded">adminpassword</code></p>
              <p>کارشناس: <code className="bg-gray-200 px-1 rounded">hr</code> / <code className="bg-gray-200 px-1 rounded">hrpassword</code></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
