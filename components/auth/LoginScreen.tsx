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
    'block w-full px-3 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-extrabold text-center text-gray-900">ورود به داشبورد استخدام</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="credential" className="sr-only">
                {isSupabaseEnabled ? 'ایمیل' : 'نام کاربری'}
              </label>
              <input
                id="credential"
                type={isSupabaseEnabled ? 'email' : 'text'}
                autoComplete={isSupabaseEnabled ? 'email' : 'username'}
                required
                className={inputClass}
                placeholder={isSupabaseEnabled ? 'ایمیل' : 'نام کاربری'}
                value={credential}
                onChange={e => setCredential(e.target.value)}
                dir={isSupabaseEnabled ? 'ltr' : 'rtl'}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">رمز عبور</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
                placeholder="رمز عبور"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 text-sm font-medium text-white bg-[var(--color-primary-600)] rounded-md hover:bg-[var(--color-primary-700)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        {isSupabaseEnabled ? (
          <p className="text-sm text-center text-gray-500">
            حساب کاربری ندارید؟{' '}
            <button onClick={() => setAuthScreen('register')} className="text-[var(--color-primary-600)] font-medium hover:underline">
              ثبت‌نام
            </button>
          </p>
        ) : (
          <div className="text-sm text-center text-gray-500">
            <p>راهنمایی (حالت محلی):</p>
            <p>ادمین: <code>admin</code> / <code>adminpassword</code></p>
            <p>کارشناس: <code>hr</code> / <code>hrpassword</code></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
