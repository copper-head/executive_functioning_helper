/**
 * @fileoverview React Query Client Configuration
 *
 * Configures the global QueryClient instance used by React Query for
 * data fetching, caching, and state management. Defines default behaviors
 * for query staleness, retry logic, and mutation handling.
 *
 * @module api/queryClient
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient instance for React Query.
 *
 * Configuration:
 * - Queries are considered fresh for 5 minutes (staleTime)
 * - Automatic retry up to 3 times, except for auth errors (401/403)
 * - Mutations never retry automatically (to prevent duplicate submissions)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data remains fresh for 5 minutes before refetching
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        // Authentication/authorization errors should not be retried
        // as they require user action (re-login or permission change)
        if (error instanceof Error && 'response' in error) {
          const status = (error as { response?: { status?: number } }).response
            ?.status;
          if (status === 401 || status === 403) {
            return false;
          }
        }
        // Retry transient failures up to 3 times
        return failureCount < 3;
      },
    },
    mutations: {
      // Never retry mutations to prevent duplicate side effects
      // (e.g., duplicate form submissions, duplicate records)
      retry: false,
    },
  },
});
