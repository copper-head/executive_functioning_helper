import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/utils';
import ProtectedRoute from './ProtectedRoute';

const mockAuthStore = {
  isAuthenticated: false,
  isLoading: false,
};

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.isLoading = false;
  });

  it('renders children when authenticated', () => {
    mockAuthStore.isAuthenticated = true;

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading is true', () => {
    mockAuthStore.isLoading = true;

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.isLoading = false;

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('does not render children while loading', () => {
    mockAuthStore.isLoading = true;
    mockAuthStore.isAuthenticated = true;

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
