import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, UserWithPassword } from '../types';
import { authService } from '../services/authService';
import { supabase, isSupabaseEnabled } from '../services/supabaseClient';
import { supabaseService } from '../services/supabaseService';
import { useToast } from './ToastContext';

export type AuthMode = 'local' | 'supabase';
export type AuthScreen = 'login' | 'register';

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  authMode: AuthMode;
  authScreen: AuthScreen;
  setAuthScreen: (s: AuthScreen) => void;
  // local + supabase compatible API
  users: Record<string, UserWithPassword>;
  login: (emailOrUsername: string, pass: string) => Promise<void>;
  logout: () => void;
  // user management
  addUser: (user: UserWithPassword) => void;
  updateUser: (id: string, userData: Partial<UserWithPassword>) => void;
  deleteUser: (id: string) => void;
  changePassword: (id: string, oldPass: string, newPass: string, isAdminOverride?: boolean) => Promise<void>;
  currentUser: User | null;
  restoreUsers: (users: Record<string, UserWithPassword>) => void;
  // supabase registration
  registerCompany: (companyName: string, userName: string, email: string, password: string) => Promise<void>;
  joinCompany: (companyId: string, userName: string, email: string, password: string) => Promise<void>;
  // company info
  companyId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [companyId, setCompanyId] = useState<string | null>(null);
  // Local-mode user store
  const [users, setUsers] = useState<Record<string, UserWithPassword>>(() =>
    isSupabaseEnabled ? {} : authService.getUsers()
  );
  // Supabase-mode team members (keyed by supabase user id)
  const [supabaseUsers, setSupabaseUsers] = useState<Record<string, UserWithPassword>>({});
  const { addToast } = useToast();

  const authMode: AuthMode = isSupabaseEnabled ? 'supabase' : 'local';

  // ── Load profile from Supabase ──────────────────────────────────────

  const loadProfile = useCallback(async (supabaseUserId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('name, is_admin, company_id')
      .eq('id', supabaseUserId)
      .maybeSingle();

    if (error || !data) return;

    const { data: authData } = await supabase.auth.getUser();
    const email = authData?.user?.email ?? '';

    const loadedUser: User = {
      username: email,
      name: data.name,
      isAdmin: data.is_admin,
    };
    setUser(loadedUser);
    setCompanyId(data.company_id);
    supabaseService.setCompanyId(data.company_id);

    // load team for user-management panel
    const members = await supabaseService.getTeamMembers();
    const memberMap: Record<string, UserWithPassword> = {};
    members.forEach(m => {
      memberMap[m.id] = { username: m.id, name: m.name, isAdmin: m.isAdmin };
    });
    setSupabaseUsers(memberMap);
  }, []);

  // ── Session init ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      // Local mode: restore session from sessionStorage
      const local = authService.getCurrentUser();
      if (local) setUser(local);
      setAuthLoading(false);
      return;
    }

    // Supabase mode: subscribe to auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setUser(null);
        setCompanyId(null);
        supabaseService.setCompanyId(null);
        setSupabaseUsers({});
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── Local-mode: sync users to localStorage ──────────────────────────

  useEffect(() => {
    if (!isSupabaseEnabled) {
      authService.saveUsers(users);
    }
  }, [users]);

  // ── Login ───────────────────────────────────────────────────────────

  const login = async (emailOrUsername: string, pass: string) => {
    if (!isSupabaseEnabled || !supabase) {
      // Local fallback
      try {
        const loggedIn = authService.login(emailOrUsername, pass);
        setUser(loggedIn);
        addToast(`خوش آمدید، ${loggedIn.name}!`, 'success');
      } catch (e: any) {
        addToast(e.message, 'error');
        throw e;
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: emailOrUsername, password: pass });
    if (error) {
      const msg = error.message === 'Invalid login credentials'
        ? 'ایمیل یا رمز عبور اشتباه است.'
        : error.message;
      addToast(msg, 'error');
      throw new Error(msg);
    }
    // onAuthStateChange fires and sets user
  };

  // ── Logout ──────────────────────────────────────────────────────────

  const logout = () => {
    if (isSupabaseEnabled && supabase) {
      supabase.auth.signOut();
    } else {
      authService.logout();
      setUser(null);
    }
    addToast('با موفقیت خارج شدید.', 'success');
  };

  // ── Supabase: Register new company (first admin) ────────────────────

  const registerCompany = async (companyName: string, userName: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured');

    // 1. Create company
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .insert({ name: companyName })
      .select('id')
      .single();
    if (companyErr) throw new Error(`خطا در ایجاد شرکت: ${companyErr.message}`);

    // 2. Sign up auth user
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr || !signUpData.user) {
      // rollback company
      await supabase.from('companies').delete().eq('id', company.id);
      throw new Error(`خطا در ثبت‌نام: ${signUpErr?.message}`);
    }

    // 3. Create profile
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      company_id: company.id,
      name: userName,
      is_admin: true,
    });
    if (profileErr) throw new Error(`خطا در ایجاد پروفایل: ${profileErr.message}`);

    addToast('شرکت شما ثبت شد. خوش آمدید!', 'success');
  };

  // ── Supabase: Join existing company ────────────────────────────────

  const joinCompany = async (companyId: string, userName: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured');

    // Verify company exists
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .maybeSingle();
    if (companyErr || !company) throw new Error('شناسه شرکت معتبر نیست.');

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr || !signUpData.user) throw new Error(`خطا در ثبت‌نام: ${signUpErr?.message}`);

    const { error: profileErr } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      company_id: companyId,
      name: userName,
      is_admin: false,
    });
    if (profileErr) throw new Error(`خطا در ایجاد پروفایل: ${profileErr.message}`);

    addToast('حساب کاربری ایجاد شد. خوش آمدید!', 'success');
  };

  // ── User management ─────────────────────────────────────────────────

  const addUser = (userData: UserWithPassword) => {
    if (isSupabaseEnabled) {
      addToast('برای دعوت کاربر جدید، شناسه شرکت را با ایشان به اشتراک بگذارید.', 'info' as any);
      return;
    }
    if (users[userData.username.toLowerCase()]) {
      addToast('کاربر با این نام کاربری وجود دارد.', 'error');
      return;
    }
    setUsers(prev => ({ ...prev, [userData.username.toLowerCase()]: userData }));
    addToast('کاربر جدید با موفقیت اضافه شد.', 'success');
  };

  const updateUser = async (id: string, userData: Partial<UserWithPassword>) => {
    if (isSupabaseEnabled && supabase) {
      await supabaseService.updateMember(id, {
        name: userData.name,
        isAdmin: userData.isAdmin,
      });
      setSupabaseUsers(prev => ({
        ...prev,
        [id]: { ...prev[id], ...userData },
      }));
      addToast('اطلاعات کاربر به‌روزرسانی شد.', 'success');
    } else {
      setUsers(prev => ({ ...prev, [id]: { ...prev[id], ...userData } }));
      addToast('اطلاعات کاربر به‌روزرسانی شد.', 'success');
    }
  };

  const deleteUser = async (id: string) => {
    if (isSupabaseEnabled && supabase) {
      if (id === user?.username) {
        addToast('نمی‌توانید حساب خود را حذف کنید.', 'error');
        return;
      }
      await supabaseService.removeMember(id);
      setSupabaseUsers(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      addToast('کاربر حذف شد.', 'success');
    } else {
      if (id.toLowerCase() === 'admin') {
        addToast('نمی‌توان کاربر پیش‌فرض سیستم را حذف کرد.', 'error');
        return;
      }
      setUsers(prev => {
        const next = { ...prev };
        delete next[id.toLowerCase()];
        return next;
      });
      addToast('کاربر حذف شد.', 'success');
    }
  };

  const changePassword = async (id: string, oldPass: string, newPass: string, isAdminOverride = false) => {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) {
        addToast(error.message, 'error');
        throw error;
      }
      addToast('رمز عبور با موفقیت تغییر کرد.', 'success');
    } else {
      try {
        authService.changePassword(id, oldPass, newPass, isAdminOverride);
        setUsers(authService.getUsers());
        addToast('رمز عبور با موفقیت تغییر کرد.', 'success');
      } catch (e: any) {
        addToast(e.message, 'error');
        throw e;
      }
    }
  };

  const restoreUsers = (newUsers: Record<string, UserWithPassword>) => {
    if (!isSupabaseEnabled && newUsers && typeof newUsers === 'object') {
      setUsers(newUsers);
      addToast('حساب‌های کاربری بازیابی شدند.', 'success');
    }
  };

  const activeUsers = isSupabaseEnabled ? supabaseUsers : users;

  const value: AuthContextType = {
    user, authLoading, authMode, authScreen, setAuthScreen,
    users: activeUsers,
    login, logout,
    addUser, updateUser: updateUser as any, deleteUser: deleteUser as any, changePassword,
    currentUser: user,
    restoreUsers,
    registerCompany, joinCompany,
    companyId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
