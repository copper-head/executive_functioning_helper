import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import Goals from './Goals';
import * as goalsApi from '../api/goals';
import type { Goal } from '../api/goals';

// Mock the goals API
vi.mock('../api/goals');

// Mock GoalCard and GoalModal to simplify testing
vi.mock('../components/GoalCard', () => ({
  GoalCard: ({ goal, onEdit, onDelete }: { goal: Goal; onEdit: (g: Goal) => void; onDelete: (id: string) => void }) => (
    <div data-testid={`goal-card-${goal.id}`}>
      <span>{goal.title}</span>
      <span data-testid={`status-${goal.id}`}>{goal.status}</span>
      <button onClick={() => onEdit(goal)}>Edit</button>
      <button onClick={() => onDelete(goal.id)}>Delete</button>
    </div>
  ),
}));

vi.mock('../components/GoalModal', () => ({
  GoalModal: ({ isOpen, onClose, onSave, goal }: { isOpen: boolean; onClose: () => void; onSave: (data: unknown) => Promise<void>; goal?: Goal }) => (
    isOpen ? (
      <div data-testid="goal-modal">
        <span data-testid="modal-mode">{goal ? 'edit' : 'create'}</span>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSave({ title: 'New Goal' })}>Save</button>
      </div>
    ) : null
  ),
}));

const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Short term goal',
    description: 'Due in 3 days',
    status: 'active',
    priority: 1,
    target_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'goal-2',
    title: 'Medium term goal',
    description: 'Due in 2 weeks',
    status: 'active',
    priority: 2,
    target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'goal-3',
    title: 'Completed goal',
    description: 'Already done',
    status: 'completed',
    priority: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('Goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(goalsApi.getGoals).mockResolvedValue(mockGoals);
    vi.mocked(goalsApi.createGoal).mockResolvedValue(mockGoals[0]);
    vi.mocked(goalsApi.updateGoal).mockResolvedValue(mockGoals[0]);
    vi.mocked(goalsApi.deleteGoal).mockResolvedValue(undefined);
  });

  it('renders loading state initially', () => {
    vi.mocked(goalsApi.getGoals).mockImplementation(() => new Promise(() => {}));
    render(<Goals />);

    expect(screen.getByText('Loading goals...')).toBeInTheDocument();
  });

  it('renders page header and new goal button', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Goals' })).toBeInTheDocument();
    });
    expect(screen.getByText('Manage your goals and track progress')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Goal/i })).toBeInTheDocument();
  });

  it('fetches and displays goals on mount', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });
    expect(screen.getByText('Medium term goal')).toBeInTheDocument();
    expect(screen.getByText('Completed goal')).toBeInTheDocument();
    expect(goalsApi.getGoals).toHaveBeenCalledTimes(1);
  });

  it('shows error when goals fail to load', async () => {
    vi.mocked(goalsApi.getGoals).mockRejectedValue(new Error('Network error'));
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load goals')).toBeInTheDocument();
    });
  });

  it('opens create modal when clicking New Goal', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /New Goal/i }));

    expect(screen.getByTestId('goal-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-mode')).toHaveTextContent('create');
  });

  it('opens edit modal when clicking Edit on a goal', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    fireEvent.click(editButtons[0]);

    expect(screen.getByTestId('goal-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-mode')).toHaveTextContent('edit');
  });

  it('closes modal when clicking Close', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /New Goal/i }));
    expect(screen.getByTestId('goal-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('goal-modal')).not.toBeInTheDocument();
  });

  it('filters goals by status', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });

    // Select "Completed" status filter
    const statusSelect = screen.getByDisplayValue('All statuses');
    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    // Should only show completed goal
    expect(screen.queryByText('Short term goal')).not.toBeInTheDocument();
    expect(screen.queryByText('Medium term goal')).not.toBeInTheDocument();
    expect(screen.getByText('Completed goal')).toBeInTheDocument();
  });

  it('filters goals by time horizon', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });

    // Select "Short term" filter
    const horizonSelect = screen.getByDisplayValue('All timeframes');
    fireEvent.change(horizonSelect, { target: { value: 'short' } });

    // Should only show short term goal
    expect(screen.getByText('Short term goal')).toBeInTheDocument();
    expect(screen.queryByText('Medium term goal')).not.toBeInTheDocument();
  });

  it('shows empty state when no goals exist', async () => {
    vi.mocked(goalsApi.getGoals).mockResolvedValue([]);
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('No goals yet')).toBeInTheDocument();
    });
    expect(screen.getByText('Create your first goal')).toBeInTheDocument();
  });

  it('shows filter empty state when filters exclude all goals', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });

    // Filter to archived (none exist)
    const statusSelect = screen.getByDisplayValue('All statuses');
    fireEvent.change(statusSelect, { target: { value: 'archived' } });

    expect(screen.getByText('No goals match your filters')).toBeInTheDocument();
  });

  it('toggles between grid and list view', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });

    const gridButton = screen.getByTitle('Grid view');
    const listButton = screen.getByTitle('List view');

    // Initially in grid view
    fireEvent.click(listButton);
    // View mode changed to list

    fireEvent.click(gridButton);
    // View mode changed back to grid
  });

  it('shows delete confirmation on first click', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    // Should show confirmation
    await waitFor(() => {
      expect(screen.getByText('Click delete again to confirm')).toBeInTheDocument();
    });
  });

  it('deletes goal on confirmation click', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });

    // Click delete on the first goal card
    const goalCard = screen.getByTestId('goal-card-goal-1');
    const deleteButton = goalCard.querySelector('button:last-child');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(screen.getByText('Click delete again to confirm')).toBeInTheDocument();
    });

    // Click the confirmation delete button (the one in the red overlay)
    const confirmDeleteButton = screen.getByText('Click delete again to confirm')
      .closest('div')
      ?.querySelector('button');
    fireEvent.click(confirmDeleteButton!);

    await waitFor(() => {
      expect(goalsApi.deleteGoal).toHaveBeenCalledWith('goal-1');
    });
  });

  it('refetches goals after saving', async () => {
    render(<Goals />);

    await waitFor(() => {
      expect(screen.getByText('Short term goal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /New Goal/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      // Initial fetch + fetch after save
      expect(goalsApi.getGoals).toHaveBeenCalledTimes(2);
    });
  });
});
