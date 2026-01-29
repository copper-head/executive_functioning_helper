import { vi } from 'vitest';

// Mock API responses
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

// Helper to mock successful API responses
export function mockApiResponse<T>(data: T) {
  return { data, status: 200, statusText: 'OK' };
}

// Helper to mock API errors
export function mockApiError(status: number, message: string) {
  const error = new Error(message) as Error & { response?: { status: number; data: { detail: string } } };
  error.response = {
    status,
    data: { detail: message },
  };
  return error;
}

// Mock the apiClient module
export function setupApiMocks() {
  vi.mock('@/api/client', () => ({
    apiClient: mockApiClient,
    getStoredToken: vi.fn(() => 'mock-token'),
    setStoredToken: vi.fn(),
    clearStoredTokens: vi.fn(),
  }));
}
