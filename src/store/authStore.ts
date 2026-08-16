import { create } from 'zustand';
import type { User } from '@/types';
import { authAPI } from '@/services/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const user = parsed?.user ?? parsed;
    if (user?.id && user?.email) return user as User;
    return null;
  } catch {
    return null;
  }
}

function persistSession(token: string | null, user: User | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

function statusOf(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}

const storedToken = localStorage.getItem(TOKEN_KEY);
const storedUser = readStoredUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storedUser,
  token: storedToken,
  // Wait for /auth/profile when a token exists so refresh does not bounce to login.
  isLoading: Boolean(storedToken),
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const token = response.access_token || response.token;
      if (!token) {
        throw new Error('No token received from server');
      }
      const user = response.user;
      persistSession(token, user);
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed',
        isLoading: false,
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
      persistSession(null, null);
      set({ user: null, token: null, isLoading: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      persistSession(null, null);
      set({ user: null, token: null, isLoading: false });
      return;
    }

    set({ isLoading: true, token });
    try {
      const user = await authAPI.me();
      persistSession(token, user);
      set({ user, token, isLoading: false });
    } catch (error) {
      const status = statusOf(error);
      if (status === 401 || status === 403) {
        persistSession(null, null);
        set({ user: null, token: null, isLoading: false });
        return;
      }
      // Network / 5xx / 404 blips: keep the cached session so a refresh does not log out.
      console.error('Auth check failed:', error);
      set({
        user: get().user ?? readStoredUser(),
        token,
        isLoading: false,
      });
    }
  },
}));
