import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import WeeklyPlanning from './WeeklyPlanning';

// Mock child components
vi.mock('../components/WeekSelector', () => ({
  WeekSelector: ({ weekStart, onPrevWeek, onNextWeek }: { weekStart: Date; onPrevWeek: () => void; onNextWeek: () => void }) => (
    <div data-testid="week-selector">
      <span data-testid="week-date">{weekStart.toISOString().split('T')[0]}</span>
      <button onClick={onPrevWeek}>Previous Week</button>
      <button onClick={onNextWeek}>Next Week</button>
    </div>
  ),
}));

vi.mock('../components/FocusAreasEditor', () => ({
  FocusAreasEditor: ({ focusAreas, onChange }: { focusAreas: string[]; onChange: (areas: string[]) => void }) => (
    <div data-testid="focus-areas-editor">
      <span data-testid="focus-areas-count">{focusAreas.length}</span>
      <button onClick={() => onChange([...focusAreas, 'New Area'])}>Add Focus Area</button>
    </div>
  ),
}));

describe('WeeklyPlanning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  it('renders page header', () => {
    render(<WeeklyPlanning />);

    expect(screen.getByRole('heading', { name: 'Weekly Planning' })).toBeInTheDocument();
  });

  it('renders WeekSelector component', () => {
    render(<WeeklyPlanning />);

    expect(screen.getByTestId('week-selector')).toBeInTheDocument();
  });

  it('renders week overview with 7 days', () => {
    render(<WeeklyPlanning />);

    expect(screen.getByText('Week Overview')).toBeInTheDocument();
    // Should have links for each day
    const dayLinks = screen.getAllByRole('link');
    expect(dayLinks.length).toBe(7);
  });

  it('displays day names and dates', () => {
    render(<WeeklyPlanning />);

    // Check for day abbreviations
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('links days to daily planning page with correct dates', () => {
    render(<WeeklyPlanning />);

    const dayLinks = screen.getAllByRole('link');
    dayLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', expect.stringMatching(/^\/daily\?date=\d{4}-\d{2}-\d{2}$/));
    });
  });

  it('renders Focus Areas section', () => {
    render(<WeeklyPlanning />);

    expect(screen.getByRole('heading', { name: 'Focus Areas' })).toBeInTheDocument();
    expect(screen.getByTestId('focus-areas-editor')).toBeInTheDocument();
  });

  it('renders Status section with dropdown', () => {
    render(<WeeklyPlanning />);

    expect(screen.getByRole('heading', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Planning')).toBeInTheDocument();
  });

  it('renders Weekly Summary section with textarea', () => {
    render(<WeeklyPlanning />);

    expect(screen.getByRole('heading', { name: 'Weekly Summary' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write a summary for this week/)).toBeInTheDocument();
  });

  it('navigates to previous week', () => {
    render(<WeeklyPlanning />);

    const initialDate = screen.getByTestId('week-date').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Previous Week' }));

    const newDate = screen.getByTestId('week-date').textContent;
    expect(newDate).not.toBe(initialDate);
  });

  it('navigates to next week', () => {
    render(<WeeklyPlanning />);

    const initialDate = screen.getByTestId('week-date').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Next Week' }));

    const newDate = screen.getByTestId('week-date').textContent;
    expect(newDate).not.toBe(initialDate);
  });

  it('updates focus areas', () => {
    render(<WeeklyPlanning />);

    expect(screen.getByTestId('focus-areas-count')).toHaveTextContent('0');

    fireEvent.click(screen.getByRole('button', { name: 'Add Focus Area' }));

    expect(screen.getByTestId('focus-areas-count')).toHaveTextContent('1');
  });

  it('updates weekly summary', () => {
    render(<WeeklyPlanning />);

    const textarea = screen.getByPlaceholderText(/Write a summary for this week/);
    fireEvent.change(textarea, { target: { value: 'This week I want to focus on learning.' } });

    expect(textarea).toHaveValue('This week I want to focus on learning.');
  });

  it('updates status', () => {
    render(<WeeklyPlanning />);

    const select = screen.getByDisplayValue('Planning');
    fireEvent.change(select, { target: { value: 'in_progress' } });

    expect(screen.getByDisplayValue('In Progress')).toBeInTheDocument();
  });

  it('has all status options available', () => {
    render(<WeeklyPlanning />);

    const select = screen.getByDisplayValue('Planning');
    expect(select).toContainHTML('Planning');
    expect(select).toContainHTML('In Progress');
    expect(select).toContainHTML('Completed');
    expect(select).toContainHTML('Reviewed');
  });

  it('starts with empty focus areas', () => {
    render(<WeeklyPlanning />);

    expect(screen.getByTestId('focus-areas-count')).toHaveTextContent('0');
  });

  it('starts with empty summary', () => {
    render(<WeeklyPlanning />);

    expect(screen.getByPlaceholderText(/Write a summary for this week/)).toHaveValue('');
  });

  it('starts with planning status', () => {
    render(<WeeklyPlanning />);

    expect(screen.getByDisplayValue('Planning')).toBeInTheDocument();
  });
});
