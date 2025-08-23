import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserWithPassword } from '../types';
import { authService } from '../services/authService';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  users: Record<string, UserWithPassword>;
  login: (username: string, pass: string) => void;
  logout: () => void;
  addUser: (user: UserWithPassword) => void;
  updateUser: (username: string, userData: Partial<UserWithPassword>) => void;
  deleteUser: (username: string) => void;
  changePassword: (username: string, oldPass: string, newPass: string, isAdminOverride?: boolean) => void;
  currentUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Record<string, UserWithPassword>>(() => authService.getUsers());
  const { addToast } = useToast();

  useEffect(() => {
    const loggedInUser = authService.getCurrentUser();
    if (loggedInUser) {
      setUser(loggedInUser);
    }
  }, []);

  useEffect(() => {
    authService.saveUsers(users);
  }, [users]);
  
  const login = (username: string, pass: string) => {
     try {
      const loggedInUser = authService.login(username, pass);
      setUser(loggedInUser);
      addToast(`خوش آمدید، ${loggedInUser.name}!`, 'success');
    } catch (e: any) {
      addToast(e.message, 'error');
      // Re-throw for the login form to catch
      throw e;
    }
  };

  const logout = () => {
     authService.logout();
     setUser(null);
     addToast('با موفقیت خارج شدید.', 'success');
  };
  
  const addUser = (userData: UserWithPassword) => {
      if (users[userData.username.toLowerCase()]) {
          addToast('کاربر با این نام کاربری وجود دارد.', 'error');
          return;
      }
      setUsers(prev => ({...prev, [userData.username.toLowerCase()]: userData }));
      addToast('کاربر جدید با موفقیت اضافه شد.', 'success');
  }
  
  const updateUser = (username: string, userData: Partial<UserWithPassword>) => {
      setUsers(prev => ({...prev, [username]: { ...prev[username], ...userData }}));
      addToast('اطلاعات کاربر به‌روزرسانی شد.', 'success');
  }
  
  const deleteUser = (username: string) => {
      if (username.toLowerCase() === 'admin') {
        addToast('شما نمی‌توانید کاربر پیش‌فرض سیستم را حذف کنید.', 'error');
        return;
      }
      const newUsers = {...users};
      delete newUsers[username.toLowerCase()];
      setUsers(newUsers);
      addToast('کاربر حذف شد.', 'success');
  }

  const changePassword = (username: string, oldPass: string, newPass: string, isAdminOverride: boolean = false) => {
      try {
          authService.changePassword(username, oldPass, newPass, isAdminOverride);
          setUsers(authService.getUsers());
          addToast('رمز عبور با موفقیت تغییر کرد.', 'success');
      } catch(e: any) {
          addToast(e.message, 'error');
      }
  }

  const value = { user, users, login, logout, addUser, updateUser, deleteUser, changePassword, currentUser: user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
