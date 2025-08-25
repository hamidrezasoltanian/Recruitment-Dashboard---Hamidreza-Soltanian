import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, UserWithPassword } from '../types';
import { authService } from '../services/authService';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  addUser: (user: UserWithPassword) => Promise<void>;
  updateUser: (id: string, userData: Partial<UserWithPassword>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUserSettings: (settings: { kanbanBackground: string }) => Promise<void>;
  reloadUsers: () => Promise<void>; // To refresh user list
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
  const [users, setUsers] = useState<User[]>([]); // For admin panel
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const loadUserProfile = useCallback(async () => {
    const token = authService.getToken();
    if (token) {
      try {
        const profile = await authService.getCurrentUserProfile();
        setUser(profile);
        if (profile.isAdmin) {
          await reloadUsers();
        }
      } catch (error) {
        console.error('Session expired or invalid.', error);
        authService.removeToken();
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);
  
  const login = async (username: string, pass: string) => {
    try {
      const { token, user: loggedInUser } = await authService.login(username, pass);
      authService.setToken(token);
      setUser(loggedInUser);
      addToast(`خوش آمدید، ${loggedInUser.name}!`, 'success');
      if (loggedInUser.isAdmin) {
          await reloadUsers();
      }
    } catch (e: any) {
      addToast(e.message || 'خطا در ورود', 'error');
      throw e;
    }
  };

  const logout = () => {
     authService.logout();
     setUser(null);
     setUsers([]);
     addToast('با موفقیت خارج شدید.', 'success');
  };

  const reloadUsers = async () => {
    if (user?.isAdmin) {
        try {
            const userList = await authService.getAllUsers();
            setUsers(userList);
        } catch (error: any) {
            addToast(`خطا در بارگذاری لیست کاربران: ${error.message}`, 'error');
        }
    }
  };
  
  const addUser = async (userData: UserWithPassword) => {
    try {
        await authService.createUser(userData);
        await reloadUsers();
        addToast('کاربر جدید با موفقیت اضافه شد.', 'success');
    } catch(e:any) {
        addToast(e.message, 'error');
        throw e;
    }
  };
  
  const updateUser = async (id: string, userData: Partial<UserWithPassword>) => {
    try {
        await authService.updateUser(id, userData);
        await reloadUsers();
        addToast('اطلاعات کاربر به‌روزرسانی شد.', 'success');
    } catch (e: any) {
        addToast(e.message, 'error');
        throw e;
    }
  };

  const updateUserSettings = async (settings: { kanbanBackground: string }) => {
      if (!user) return;
      try {
          const updatedUser = await authService.updateCurrentUser({ settings });
          setUser(updatedUser); // Update local user state with new settings
          addToast('تنظیمات شما ذخیره شد.', 'success');
      } catch (e: any) {
          addToast(e.message, 'error');
      }
  };
  
  const deleteUser = async (id: string) => {
    try {
        await authService.deleteUser(id);
        await reloadUsers();
        addToast('کاربر حذف شد.', 'success');
    } catch(e: any) {
        addToast(e.message, 'error');
        throw e;
    }
  };

  const value = { 
      user, 
      users, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout, 
      addUser, 
      updateUser, 
      deleteUser, 
      updateUserSettings,
      reloadUsers
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
