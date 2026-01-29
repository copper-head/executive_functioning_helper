import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import Signup from './Signup';
import * as authStore from '../stores/authStore';

// Mock the auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockSignup = vi.fn();

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authStore.useAuthStore).mockImplementation((selector) => {
      const state = { signup: mockSignup };
      return selector(state as unknown as authStore.AuthState);
    });
  });

  it('renders signup form with all fields', () => {
    render(<Signup />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('renders heading and login link', () => {
    render(<Signup />);

    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('shows validation error when submitting empty form', async () => {
    render(<Signup />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('shows validation error when passwords do not match', async () => {
    render(<Signup />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('shows validation error when password is too short', async () => {
    render(<Signup />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('calls signup with valid data on submission', async () => {
    mockSignup.mockResolvedValue(undefined);
    render(<Signup />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows loading state while submitting', async () => {
    mockSignup.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<Signup />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
    });
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByLabelText('Confirm password')).toBeDisabled();
  });

  it('shows error message on signup failure', async () => {
    mockSignup.mockRejectedValue(new Error('Email already in use'));
    render(<Signup />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });

  it('shows generic error when signup throws non-Error', async () => {
    mockSignup.mockRejectedValue('network error');
    render(<Signup />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create account')).toBeInTheDocument();
    });
  });

  it('re-enables form after failed submission', async () => {
    mockSignup.mockRejectedValue(new Error('Signup failed'));
    render(<Signup />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign up' })).not.toBeDisabled();
    });
    expect(screen.getByLabelText('Name')).not.toBeDisabled();
  });
});
