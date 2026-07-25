import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserWithPassword } from '../types';
import { apiService } from '../services/apiService';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  currentUser: User | null;
  users: Record<string, UserWithPassword>;
  addUser: (userData: any) => Promise<void>;
  updateUser: (username: string, data: any) => Promise<void>;
  deleteUser: (username: string) => Promise<void>;
  restoreUsers: (users: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<Record<string, UserWithPassword>>({});
  const { addToast } = useToast();

  const refreshUsers = async () => {
    try {
      const usersList = await apiService.getUsers();
      const usersMap: Record<string, UserWithPassword> = {};
      usersList.forEach(u => {
        usersMap[u.username] = u as any;
      });
      setUsers(usersMap);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      apiService.getProfile()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('authToken');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshUsers();
    } else {
      setUsers({});
    }
  }, [user]);

  const login = async (username: string, pass: string) => {
    const data = await apiService.login(username, pass);
    setUser(data.user);
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const addUser = async (userData: any) => {
    try {
      const newUser = await apiService.register(userData);
      setUsers(prev => ({ ...prev, [newUser.username]: newUser as UserWithPassword }));
      addToast('کاربر با موفقیت ایجاد شد.', 'success');
    } catch (e: any) {
      console.error('Failed to add user:', e);
      addToast(e.message || 'خطا در ایجاد کاربر.', 'error');
      throw e;
    }
  };

  const updateUser = async (username: string, data: any) => {
    try {
      const updatedUser = await apiService.updateUser(username, data);
      setUsers(prev => ({ ...prev, [username]: { ...prev[username], ...updatedUser } }));
      addToast('کاربر با موفقیت ویرایش شد.', 'success');
    } catch (e: any) {
      console.error('Failed to update user:', e);
      addToast(e.message || 'خطا در ویرایش کاربر.', 'error');
    }
  };

  const deleteUser = async (username: string) => {
    try {
      await apiService.deleteUser(username);
      setUsers(prev => {
        const updated = { ...prev };
        delete updated[username];
        return updated;
      });
      addToast('کاربر با موفقیت حذف شد.', 'success');
    } catch (e: any) {
      console.error('Failed to delete user:', e);
      addToast(e.message || 'خطا در حذف کاربر.', 'error');
    }
  };

  const restoreUsers = (restoredUsers: any) => {
    if (restoredUsers && typeof restoredUsers === 'object') {
      setUsers(restoredUsers);
    }
  };

  const value = { user, isLoading, login, logout, currentUser: user, users, addUser, updateUser, deleteUser, restoreUsers };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
