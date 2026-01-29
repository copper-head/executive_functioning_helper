import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import { Sidebar } from './Sidebar';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Sidebar', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders navigation items', () => {
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Daily Planning')).toBeInTheDocument();
    expect(screen.getByText('Weekly Planning')).toBeInTheDocument();
    expect(screen.getByText('Agent Chat')).toBeInTheDocument();
  });

  it('renders app branding', () => {
    render(<Sidebar />);

    expect(screen.getByText('EF Helper')).toBeInTheDocument();
    expect(screen.getByText('Executive Functioning')).toBeInTheDocument();
  });

  it('displays user email when provided', () => {
    render(<Sidebar userEmail="test@example.com" />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('displays "User" when no email provided', () => {
    render(<Sidebar />);

    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('calls onLogout and navigates to login on logout click', () => {
    const onLogout = vi.fn();
    render(<Sidebar onLogout={onLogout} />);

    const logoutButton = screen.getByText('Log out');
    fireEvent.click(logoutButton);

    expect(onLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to login even without onLogout callback', () => {
    render(<Sidebar />);

    const logoutButton = screen.getByText('Log out');
    fireEvent.click(logoutButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders navigation links with correct hrefs', () => {
    render(<Sidebar />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /goals/i })).toHaveAttribute('href', '/goals');
    expect(screen.getByRole('link', { name: /daily planning/i })).toHaveAttribute('href', '/daily');
    expect(screen.getByRole('link', { name: /weekly planning/i })).toHaveAttribute('href', '/weekly');
    expect(screen.getByRole('link', { name: /agent chat/i })).toHaveAttribute('href', '/chat');
  });
});
