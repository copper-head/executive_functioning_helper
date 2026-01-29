import { create } from 'zustand';
import {
  User,
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  getCurrentUser,
  LoginRequest,
  SignupRequest,
} from '../api/auth';
import { getStoredToken, clearStoredTokens } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getStoredToken(),
  isLoading: true,
  isAuthenticated: false,

  login: async (data: LoginRequest) => {
    set({ isLoading: true });
    try {
      await apiLogin(data);
      const user = await getCurrentUser();
      set({
        user,
        token: getStoredToken(),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (data: SignupRequest) => {
    set({ isLoading: true });
    try {
      await apiSignup(data);
      const user = await getCurrentUser();
      set({
        user,
        token: getStoredToken(),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } finally {
      clearStoredTokens();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  checkAuth: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      clearStoredTokens();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User | null) => set({ user }),
}));
