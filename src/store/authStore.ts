import { create } from 'zustand';
import type { User } from '@/types';
import { authAPI } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      console.log('Login response:', response); // Debug log
      const token = response.access_token || response.token;
      if (!token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('auth_token', token);
      set({ user: response.user, token, isLoading: false });
    } catch (error: any) {
      console.error('Login error:', error); // Debug log
      set({ 
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ user: null, token: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authAPI.me();
      set({ user, token, isLoading: false });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
