import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import { WeekSelector } from './WeekSelector';

describe('WeekSelector', () => {
  const mockOnPrevWeek = vi.fn();
  const mockOnNextWeek = vi.fn();

  beforeEach(() => {
    mockOnPrevWeek.mockClear();
    mockOnNextWeek.mockClear();
  });

  it('displays week range within same month', () => {
    // Use explicit date to avoid timezone issues
    const weekStart = new Date(2024, 2, 11); // March 11, 2024
    render(
      <WeekSelector
        weekStart={weekStart}
        onPrevWeek={mockOnPrevWeek}
        onNextWeek={mockOnNextWeek}
      />
    );

    // Mar 11 to Mar 17 is within same month
    expect(screen.getByText(/Mar 11 - 17, 2024/)).toBeInTheDocument();
  });

  it('displays week range spanning months', () => {
    // Use a date where week crosses month boundary (March 28 + 6 = April 3)
    const weekStart = new Date(2024, 2, 28); // March 28, 2024
    render(
      <WeekSelector
        weekStart={weekStart}
        onPrevWeek={mockOnPrevWeek}
        onNextWeek={mockOnNextWeek}
      />
    );

    // Mar 28 to Apr 3 spans two months
    expect(screen.getByText(/Mar 28 - Apr 3, 2024/)).toBeInTheDocument();
  });

  it('calls onPrevWeek when clicking previous button', () => {
    const weekStart = new Date(2024, 2, 11);
    render(
      <WeekSelector
        weekStart={weekStart}
        onPrevWeek={mockOnPrevWeek}
        onNextWeek={mockOnNextWeek}
      />
    );

    const prevButton = screen.getByRole('button', { name: /previous week/i });
    fireEvent.click(prevButton);

    expect(mockOnPrevWeek).toHaveBeenCalledTimes(1);
  });

  it('calls onNextWeek when clicking next button', () => {
    const weekStart = new Date(2024, 2, 11);
    render(
      <WeekSelector
        weekStart={weekStart}
        onPrevWeek={mockOnPrevWeek}
        onNextWeek={mockOnNextWeek}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next week/i });
    fireEvent.click(nextButton);

    expect(mockOnNextWeek).toHaveBeenCalledTimes(1);
  });

  it('renders navigation buttons', () => {
    const weekStart = new Date(2024, 2, 11);
    render(
      <WeekSelector
        weekStart={weekStart}
        onPrevWeek={mockOnPrevWeek}
        onNextWeek={mockOnNextWeek}
      />
    );

    expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument();
  });
});
