import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'خطایی رخ داد.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 70% 60% at 15% 20%, rgba(56, 189, 248, 0.22), transparent 55%), radial-gradient(ellipse 50% 50% at 90% 80%, rgba(37, 99, 235, 0.35), transparent 50%), linear-gradient(145deg, #0f2744 0%, #1e3a8a 45%, #1d4ed8 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute top-[-100px] right-[-60px] w-80 h-80 rounded-full bg-sky-400/20 blur-3xl" style={{ animation: 'softPulse 8s ease-in-out infinite' }} />
      <div className="absolute bottom-[-80px] left-[-40px] w-72 h-72 rounded-full bg-blue-300/15 blur-3xl" style={{ animation: 'softPulse 10s ease-in-out infinite 1s' }} />

      <div className="relative w-full max-w-md mx-4 fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md mb-5 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">داشبورد استخدام</h1>
          <p className="text-sky-100/70 text-sm mt-2">مدیریت هوشمند فرآیند جذب نیرو</p>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/40 p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1.5">نام کاربری</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <input
                    id="username" name="username" type="text" autoComplete="username" required
                    className="block w-full pr-10 pl-4 py-3 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] focus:bg-white transition-all text-sm"
                    placeholder="نام کاربری خود را وارد کنید"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">رمز عبور</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input
                    id="password" name="password" type="password" autoComplete="current-password" required
                    className="block w-full pr-10 pl-4 py-3 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] focus:bg-white transition-all text-sm"
                    placeholder="رمز عبور خود را وارد کنید"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 px-4 text-sm font-bold text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/25 hover:shadow-xl hover:brightness-110 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)] disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))' }}
            >
              {isLoading ? 'در حال ورود...' : 'ورود به سیستم'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
