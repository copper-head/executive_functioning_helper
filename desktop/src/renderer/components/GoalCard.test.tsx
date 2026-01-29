import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import { GoalCard } from './GoalCard';
import { Goal } from '../api/goals';

const mockGoal: Goal = {
  id: 'goal-1',
  title: 'Complete project',
  description: 'Finish the implementation',
  status: 'active',
  priority: 3,
  target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('GoalCard', () => {
  it('renders goal title and description', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<GoalCard goal={mockGoal} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Complete project')).toBeInTheDocument();
    expect(screen.getByText('Finish the implementation')).toBeInTheDocument();
  });

  it('displays correct status', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<GoalCard goal={mockGoal} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows priority level', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<GoalCard goal={mockGoal} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('P3')).toBeInTheDocument();
  });

  it('calls onEdit when card is clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<GoalCard goal={mockGoal} onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('Complete project'));

    expect(onEdit).toHaveBeenCalledWith(mockGoal);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<GoalCard goal={mockGoal} onEdit={onEdit} onDelete={onDelete} />);

    // Find the button with MoreVertical icon (delete trigger)
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('goal-1');
    // Should not trigger onEdit
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('displays target date when provided', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<GoalCard goal={mockGoal} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText(/Due/)).toBeInTheDocument();
  });

  it('shows correct time horizon badge', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<GoalCard goal={mockGoal} onEdit={onEdit} onDelete={onDelete} />);

    // 7 days from now should be "Short term"
    expect(screen.getByText('Short term')).toBeInTheDocument();
  });
});
