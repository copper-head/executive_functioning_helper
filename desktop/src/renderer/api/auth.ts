/**
 * @fileoverview Authentication API Functions
 *
 * Provides functions for user authentication operations including signup,
 * login, logout, and fetching the current user profile. Automatically
 * manages token storage on successful authentication.
 *
 * @module api/auth
 */

import { apiClient, setStoredToken, clearStoredTokens } from './client';

/**
 * Represents an authenticated user in the system.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address (used for login) */
  email: string;
  /** User's display name */
  name: string;
  /** ISO timestamp of when the user account was created */
  created_at: string;
}

/**
 * Response returned from successful authentication operations.
 */
export interface AuthResponse {
  /** JWT access token for authenticating subsequent requests */
  access_token: string;
  /** Token type, typically "bearer" */
  token_type: string;
}

/**
 * Request payload for creating a new user account.
 */
export interface SignupRequest {
  /** Email address for the new account */
  email: string;
  /** Password for the new account */
  password: string;
  /** Display name for the new user */
  name: string;
}

/**
 * Request payload for authenticating an existing user.
 */
export interface LoginRequest {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Creates a new user account and automatically logs them in.
 * Stores the received token for subsequent authenticated requests.
 *
 * @param data - Signup credentials including email, password, and name
 * @returns Authentication response containing the access token
 * @throws Error if signup fails (e.g., email already exists)
 */
export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/signup', data);
  setStoredToken(response.data.access_token);
  return response.data;
}

/**
 * Authenticates an existing user with their credentials.
 * Stores the received token for subsequent authenticated requests.
 *
 * @param data - Login credentials (email and password)
 * @returns Authentication response containing the access token
 * @throws Error if credentials are invalid
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  setStoredToken(response.data.access_token);
  return response.data;
}

/**
 * Logs out the current user by invalidating the session server-side
 * and clearing local token storage.
 *
 * Note: Tokens are always cleared locally even if the server request fails,
 * ensuring the user is logged out client-side regardless.
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    // Always clear local tokens, even if server logout fails
    clearStoredTokens();
  }
}

/**
 * Fetches the profile of the currently authenticated user.
 * Used to verify authentication state and retrieve user details.
 *
 * @returns The authenticated user's profile
 * @throws Error if not authenticated (401) or other API errors
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}
