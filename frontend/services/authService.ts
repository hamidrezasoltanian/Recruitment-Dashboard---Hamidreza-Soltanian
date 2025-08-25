import { User, UserWithPassword } from '../types';
import { api } from './api';

const TOKEN_KEY = 'recruitment_auth_token';

interface LoginResponse {
    token: string;
    user: User;
}

export const authService = {
    getToken: (): string | null => {
        return localStorage.getItem(TOKEN_KEY);
    },

    setToken: (token: string): void => {
        localStorage.setItem(TOKEN_KEY, token);
    },

    removeToken: (): void => {
        localStorage.removeItem(TOKEN_KEY);
    },

    login: async (username: string, password: string): Promise<LoginResponse> => {
        return api.post<LoginResponse>('/auth/login', { username, password });
    },

    logout: (): void => {
        authService.removeToken();
        // In a real app, you might also want to call a /auth/logout endpoint
        // on the backend to invalidate the token on the server-side.
    },
    
    getCurrentUserProfile: async (): Promise<User> => {
        return api.get<User>('/users/me');
    },

    // --- Admin Functions ---
    getAllUsers: async (): Promise<User[]> => {
        return api.get<User[]>('/users');
    },

    createUser: async (userData: UserWithPassword): Promise<User> => {
        return api.post<User>('/users', userData);
    },

    updateUser: async (id: string, userData: Partial<UserWithPassword>): Promise<User> => {
        return api.put<User>(`/users/${id}`, userData);
    },
    
    deleteUser: async (id: string): Promise<void> => {
        return api.delete<void>(`/users/${id}`);
    },

    updateCurrentUser: async(userData: Partial<User>): Promise<User> => {
        return api.put<User>('/users/me', userData);
    }
};
