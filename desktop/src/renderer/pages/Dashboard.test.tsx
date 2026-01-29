import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/utils';
import Dashboard from './Dashboard';
import * as authStore from '../stores/authStore';

// Mock the auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the child components to simplify testing
vi.mock('../components/TodaySummary', () => ({
  TodaySummary: () => <div data-testid="today-summary">Today's Summary</div>,
}));

vi.mock('../components/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authStore.useAuthStore).mockImplementation((selector) => {
      const state = { user: { email: 'john@example.com' } };
      return selector(state as unknown as authStore.AuthState);
    });
  });

  it('renders greeting with user name from email', () => {
    render(<Dashboard />);

    // Should extract "john" from "john@example.com"
    expect(screen.getByText(/john/)).toBeInTheDocument();
  });

  it('shows "there" when user has no email', () => {
    vi.mocked(authStore.useAuthStore).mockImplementation((selector) => {
      const state = { user: null };
      return selector(state as unknown as authStore.AuthState);
    });

    render(<Dashboard />);

    expect(screen.getByText(/there/)).toBeInTheDocument();
  });

  it('displays current date', () => {
    render(<Dashboard />);

    // Check that some date-related text is present (format varies by time)
    const dateElement = screen.getByText(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
    expect(dateElement).toBeInTheDocument();
  });

  it('renders TodaySummary component', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('today-summary')).toBeInTheDocument();
  });

  it('renders QuickActions component', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
  });

  it('renders Active Goals section', () => {
    render(<Dashboard />);

    expect(screen.getByText('Active Goals')).toBeInTheDocument();
  });

  it('displays mock goals with progress bars', () => {
    render(<Dashboard />);

    expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    expect(screen.getByText('Exercise 3x per week')).toBeInTheDocument();
    expect(screen.getByText('Read 2 books this month')).toBeInTheDocument();

    // Check progress percentages
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders Last Agent Message section', () => {
    render(<Dashboard />);

    expect(screen.getByText('Last Agent Message')).toBeInTheDocument();
    expect(screen.getByText(/I've updated your daily plan/)).toBeInTheDocument();
    expect(screen.getByText('10:32 AM')).toBeInTheDocument();
  });

  it('uses appropriate greeting based on time of day', () => {
    // This test verifies the greeting function exists and returns something
    render(<Dashboard />);

    // Should have one of the greeting texts
    const greetingElement = screen.getByRole('heading', { level: 1 });
    expect(greetingElement.textContent).toMatch(/Good (morning|afternoon|evening)/);
  });
});
