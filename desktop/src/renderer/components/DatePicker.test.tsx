import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  const mockOnDateChange = vi.fn();
  const fixedDate = new Date('2024-03-15T12:00:00');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
    mockOnDateChange.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays "Today" when selected date is today', () => {
    render(<DatePicker selectedDate={fixedDate} onDateChange={mockOnDateChange} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('displays "Tomorrow" when selected date is tomorrow', () => {
    const tomorrow = new Date('2024-03-16T12:00:00');
    render(<DatePicker selectedDate={tomorrow} onDateChange={mockOnDateChange} />);

    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
  });

  it('displays "Yesterday" when selected date is yesterday', () => {
    const yesterday = new Date('2024-03-14T12:00:00');
    render(<DatePicker selectedDate={yesterday} onDateChange={mockOnDateChange} />);

    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('displays full date format for other dates', () => {
    const otherDate = new Date('2024-03-20T12:00:00');
    render(<DatePicker selectedDate={otherDate} onDateChange={mockOnDateChange} />);

    expect(screen.getByText('Wednesday, March 20')).toBeInTheDocument();
  });

  it('navigates to previous day when clicking previous button', () => {
    render(<DatePicker selectedDate={fixedDate} onDateChange={mockOnDateChange} />);

    const prevButton = screen.getByRole('button', { name: /previous day/i });
    fireEvent.click(prevButton);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const newDate = mockOnDateChange.mock.calls[0][0];
    expect(newDate.getDate()).toBe(14);
  });

  it('navigates to next day when clicking next button', () => {
    render(<DatePicker selectedDate={fixedDate} onDateChange={mockOnDateChange} />);

    const nextButton = screen.getByRole('button', { name: /next day/i });
    fireEvent.click(nextButton);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const newDate = mockOnDateChange.mock.calls[0][0];
    expect(newDate.getDate()).toBe(16);
  });

  it('hides "Today" button when already on today', () => {
    render(<DatePicker selectedDate={fixedDate} onDateChange={mockOnDateChange} />);

    expect(screen.queryByRole('button', { name: /today/i })).not.toBeInTheDocument();
  });

  it('shows "Today" button when not on today', () => {
    const otherDate = new Date('2024-03-20T12:00:00');
    render(<DatePicker selectedDate={otherDate} onDateChange={mockOnDateChange} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('navigates to today when clicking Today button', () => {
    const otherDate = new Date('2024-03-20T12:00:00');
    render(<DatePicker selectedDate={otherDate} onDateChange={mockOnDateChange} />);

    const todayButton = screen.getByRole('button', { name: /today/i });
    fireEvent.click(todayButton);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
  });

  it('displays short date format', () => {
    render(<DatePicker selectedDate={fixedDate} onDateChange={mockOnDateChange} />);

    expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument();
  });
});
