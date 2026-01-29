/**
 * @fileoverview API Client Configuration
 *
 * Central HTTP client setup using Axios for all backend API communication.
 * Handles authentication token management and automatic request/response
 * interceptors for auth header injection and 401 error handling.
 *
 * @module api/client
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Base URL for all API requests.
 * Uses VITE_API_URL environment variable if set, otherwise defaults to localhost.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Configured Axios instance for API communication.
 * All API modules should use this client to ensure consistent
 * authentication and error handling behavior.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** localStorage key for persisting the JWT authentication token */
const TOKEN_KEY = 'auth_token';

/**
 * Retrieves the stored authentication token from localStorage.
 * @returns The JWT token if present, null otherwise
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Persists the authentication token to localStorage.
 * Called after successful login/signup to maintain session across page reloads.
 * @param token - The JWT access token to store
 */
export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Removes the authentication token from localStorage.
 * Called on logout or when a 401 response is received.
 */
export function clearStoredTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Request interceptor: Automatically attaches the Bearer token
 * to all outgoing requests if a token exists in storage.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: Handles authentication failures globally.
 * On 401 Unauthorized responses, clears stored tokens and redirects
 * to login page to force re-authentication.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearStoredTokens();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
