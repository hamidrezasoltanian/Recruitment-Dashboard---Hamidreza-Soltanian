import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserWithPassword } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  currentUser: User | null;
  users: Record<string, UserWithPassword>;
  addUser: (userData: any) => Promise<void>;
  updateUser: (username: string, data: any) => void;
  deleteUser: (username: string) => void;
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
    } catch (e) {
      console.error('Failed to add user:', e);
    }
  };

  const updateUser = (_username: string, _data: any) => {
    // Stub - update user data locally
    setUsers(prev => {
      if (!prev[_username]) return prev;
      return { ...prev, [_username]: { ...prev[_username], ..._data } };
    });
  };

  const deleteUser = (_username: string) => {
    setUsers(prev => {
      const updated = { ...prev };
      delete updated[_username];
      return updated;
    });
  };

  const restoreUsers = (restoredUsers: any) => {
    if (restoredUsers && typeof restoredUsers === 'object') {
      setUsers(restoredUsers);
    }
  };

  const value = { user, isLoading, login, logout, currentUser: user, users, addUser, updateUser, deleteUser, restoreUsers };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
