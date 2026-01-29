/**
 * @fileoverview Authentication State Store
 *
 * Global state management for user authentication using Zustand.
 * Handles login, signup, logout, and session restoration on app load.
 * Provides reactive auth state that components can subscribe to.
 *
 * @module stores/authStore
 */

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

/**
 * Authentication state shape and actions.
 */
interface AuthState {
  /** Currently authenticated user, null if not logged in */
  user: User | null;
  /** JWT token from storage, null if not logged in */
  token: string | null;
  /** True while auth operations are in progress */
  isLoading: boolean;
  /** True if user is authenticated (has valid session) */
  isAuthenticated: boolean;

  /** Authenticate with email/password credentials */
  login: (data: LoginRequest) => Promise<void>;
  /** Create new account and authenticate */
  signup: (data: SignupRequest) => Promise<void>;
  /** End current session and clear credentials */
  logout: () => Promise<void>;
  /** Verify stored token is still valid (called on app load) */
  checkAuth: () => Promise<void>;
  /** Manually set user (used for profile updates) */
  setUser: (user: User | null) => void;
}

/**
 * Global authentication store.
 *
 * Usage in components:
 * ```typescript
 * const { user, isAuthenticated, login, logout } = useAuthStore();
 * ```
 *
 * The store initializes with token from localStorage but starts with
 * isLoading=true - call checkAuth() on app mount to validate the session.
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state - token from storage, but not yet validated
  user: null,
  token: getStoredToken(),
  isLoading: true,
  isAuthenticated: false,

  /**
   * Logs in with email/password, fetches user profile on success.
   * Updates store with authenticated state or re-throws error on failure.
   */
  login: async (data: LoginRequest) => {
    set({ isLoading: true });
    try {
      // API call stores token automatically
      await apiLogin(data);
      // Fetch user profile to populate store
      const user = await getCurrentUser();
      set({
        user,
        token: getStoredToken(),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error; // Let calling component handle the error
    }
  },

  /**
   * Creates new account and logs in, fetches user profile on success.
   * Updates store with authenticated state or re-throws error on failure.
   */
  signup: async (data: SignupRequest) => {
    set({ isLoading: true });
    try {
      // API call stores token automatically
      await apiSignup(data);
      // Fetch user profile to populate store
      const user = await getCurrentUser();
      set({
        user,
        token: getStoredToken(),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error; // Let calling component handle the error
    }
  },

  /**
   * Logs out by invalidating server session and clearing local state.
   * Always clears local state even if server request fails.
   */
  logout: async () => {
    try {
      await apiLogout();
    } finally {
      // Always clear local state, regardless of server response
      clearStoredTokens();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  /**
   * Validates stored token by fetching current user profile.
   * Called on app initialization to restore session.
   * If token is invalid or expired, clears auth state.
   */
  checkAuth: async () => {
    const token = getStoredToken();

    // No token stored - user is not logged in
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      // Validate token by fetching user profile
      const user = await getCurrentUser();
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Token invalid or expired - clear everything
      clearStoredTokens();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Directly sets the user object.
   * Useful after profile updates to sync local state.
   */
  setUser: (user: User | null) => set({ user }),
}));
