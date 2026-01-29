import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils';
import { TodaySummary } from './TodaySummary';

describe('TodaySummary', () => {
  const mockItems = [
    { id: '1', title: 'First task', completed: true, time: '9:00 AM' },
    { id: '2', title: 'Second task', completed: true, time: '10:00 AM' },
    { id: '3', title: 'Third task', completed: false, time: '11:00 AM' },
    { id: '4', title: 'Fourth task', completed: false, time: '12:00 PM' },
  ];

  it('renders with default mock items when no items provided', () => {
    render(<TodaySummary />);

    expect(screen.getByText("Today's Plan")).toBeInTheDocument();
  });

  it('renders provided items', () => {
    render(<TodaySummary items={mockItems} />);

    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
    expect(screen.getByText('Third task')).toBeInTheDocument();
    expect(screen.getByText('Fourth task')).toBeInTheDocument();
  });

  it('displays correct completion count', () => {
    render(<TodaySummary items={mockItems} />);

    expect(screen.getByText('2/4 done')).toBeInTheDocument();
  });

  it('shows all items as done when all completed', () => {
    const allCompleted = [
      { id: '1', title: 'Task 1', completed: true },
      { id: '2', title: 'Task 2', completed: true },
    ];
    render(<TodaySummary items={allCompleted} />);

    expect(screen.getByText('2/2 done')).toBeInTheDocument();
  });

  it('shows zero done when no items completed', () => {
    const noneCompleted = [
      { id: '1', title: 'Task 1', completed: false },
      { id: '2', title: 'Task 2', completed: false },
    ];
    render(<TodaySummary items={noneCompleted} />);

    expect(screen.getByText('0/2 done')).toBeInTheDocument();
  });

  it('displays times when provided', () => {
    render(<TodaySummary items={mockItems} />);

    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('applies strikethrough style to completed items', () => {
    render(<TodaySummary items={mockItems} />);

    const completedTask = screen.getByText('First task');
    expect(completedTask).toHaveClass('line-through');
  });

  it('does not apply strikethrough to incomplete items', () => {
    render(<TodaySummary items={mockItems} />);

    const incompleteTask = screen.getByText('Third task');
    expect(incompleteTask).not.toHaveClass('line-through');
  });

  it('only shows first 5 items', () => {
    const manyItems = [
      { id: '1', title: 'Task 1', completed: false },
      { id: '2', title: 'Task 2', completed: false },
      { id: '3', title: 'Task 3', completed: false },
      { id: '4', title: 'Task 4', completed: false },
      { id: '5', title: 'Task 5', completed: false },
      { id: '6', title: 'Task 6', completed: false },
      { id: '7', title: 'Task 7', completed: false },
    ];
    render(<TodaySummary items={manyItems} />);

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 5')).toBeInTheDocument();
    expect(screen.queryByText('Task 6')).not.toBeInTheDocument();
    expect(screen.queryByText('Task 7')).not.toBeInTheDocument();
  });

  it('renders section title', () => {
    render(<TodaySummary items={mockItems} />);

    expect(screen.getByText("Today's Plan")).toBeInTheDocument();
  });

  it('handles items without times', () => {
    const itemsNoTime = [
      { id: '1', title: 'Task without time', completed: false },
    ];
    render(<TodaySummary items={itemsNoTime} />);

    expect(screen.getByText('Task without time')).toBeInTheDocument();
  });
});
