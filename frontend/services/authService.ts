import { User, UserWithPassword } from '../types';

const USERS_KEY = 'recruitment_users';
const CURRENT_USER_KEY = 'recruitment_current_user';

// In a real application, passwords should be securely hashed and salted.
// For this project, we are storing them in plaintext for simplicity.

const getInitialUsers = (): Record<string, UserWithPassword> => {
  try {
    const storedUsers = localStorage.getItem(USERS_KEY);
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }
  } catch (e) {
    console.error('Failed to parse users from localStorage', e);
  }

  // Default users based on hint in LoginScreen.tsx
  return {
    'admin': {
      username: 'admin',
      name: 'ادمین سیستم',
      isAdmin: true,
      password: 'adminpassword',
    },
    'hr': {
      username: 'hr',
      name: 'کارشناس استخدام',
      isAdmin: false,
      password: 'hrpassword',
    },
  };
};

export const authService = {
  getUsers: (): Record<string, UserWithPassword> => {
    return getInitialUsers();
  },

  saveUsers: (users: Record<string, UserWithPassword>) => {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch(e) {
        console.error('Failed to save users to localStorage', e);
    }
  },

  getCurrentUser: (): User | null => {
    try {
        const userJson = sessionStorage.getItem(CURRENT_USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        console.error('Failed to parse current user from sessionStorage', e);
        return null;
    }
  },

  login: (username: string, pass: string): User => {
    const users = authService.getUsers();
    const user = users[username.toLowerCase()];
    if (user && user.password === pass) {
      // Don't store password in session storage
      const { password, ...userToStore } = user;
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToStore));
      return userToStore;
    }
    throw new Error('نام کاربری یا رمز عبور اشتباه است.');
  },

  logout: () => {
    sessionStorage.removeItem(CURRENT_USER_KEY);
  },

  changePassword: (username: string, oldPass: string, newPass: string, isAdminOverride: boolean = false) => {
    const users = authService.getUsers();
    const userToChange = users[username.toLowerCase()];
    if (!userToChange) {
      throw new Error('کاربر یافت نشد.');
    }
    if (!isAdminOverride && userToChange.password !== oldPass) {
      throw new Error('رمز عبور فعلی اشتباه است.');
    }
    userToChange.password = newPass;
    authService.saveUsers(users);
  },
};
