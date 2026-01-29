/**
 * @fileoverview Protected Route Wrapper Component
 *
 * Authentication guard that wraps routes requiring login.
 * Redirects unauthenticated users to the login page while
 * preserving their intended destination for post-login redirect.
 *
 * @module components/ProtectedRoute
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Props for the ProtectedRoute component.
 */
interface ProtectedRouteProps {
  /** Child components to render when authenticated */
  children: React.ReactNode;
}

/**
 * Route wrapper that enforces authentication.
 *
 * Behavior:
 * 1. While auth is being verified: Shows a loading spinner
 * 2. If not authenticated: Redirects to /login with return location saved
 * 3. If authenticated: Renders the children
 *
 * The saved location allows redirecting users back to their intended
 * destination after successful login.
 *
 * @param props - Component props
 * @param props.children - Content to render when authenticated
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show spinner while checking auth status (e.g., validating stored token)
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated, saving the attempted location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated - render protected content
  return <>{children}</>;
}
