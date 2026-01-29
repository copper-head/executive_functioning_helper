import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import Login from './Login';
import * as authStore from '../stores/authStore';

// Mock the auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockLogin = vi.fn();

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authStore.useAuthStore).mockImplementation((selector) => {
      const state = { login: mockLogin };
      return selector(state as unknown as authStore.AuthState);
    });
  });

  it('renders login form with email and password fields', () => {
    render(<Login />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('renders heading and signup link', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
  });

  it('shows validation error when submitting empty form', async () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows validation error when email is empty', async () => {
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  it('shows validation error when password is empty', async () => {
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  it('calls login with credentials on valid submission', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows loading state while submitting', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled();
    });
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
  });

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'));
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('shows generic error when login throws non-Error', async () => {
    mockLogin.mockRejectedValue('network error');
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('re-enables form after failed submission', async () => {
    mockLogin.mockRejectedValue(new Error('Login failed'));
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log in' })).not.toBeDisabled();
    });
    expect(screen.getByLabelText('Email')).not.toBeDisabled();
    expect(screen.getByLabelText('Password')).not.toBeDisabled();
  });
});
