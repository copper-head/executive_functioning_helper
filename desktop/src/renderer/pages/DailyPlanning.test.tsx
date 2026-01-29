import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import DailyPlanning from './DailyPlanning';
import * as plansApi from '../api/plans';
import * as goalsApi from '../api/goals';
import type { DailyPlan, PlanItem } from '../api/plans';

// Mock the APIs
vi.mock('../api/plans');
vi.mock('../api/goals');

// Mock child components
vi.mock('../components/DatePicker', () => ({
  DatePicker: ({ selectedDate, onDateChange }: { selectedDate: Date; onDateChange: (date: Date) => void }) => (
    <div data-testid="date-picker">
      <span data-testid="selected-date">{selectedDate.toISOString().split('T')[0]}</span>
      <button onClick={() => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        onDateChange(newDate);
      }}>Next Day</button>
      <button onClick={() => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        onDateChange(newDate);
      }}>Previous Day</button>
    </div>
  ),
}));

vi.mock('../components/PlanItem', () => ({
  PlanItem: ({ item, onStatusChange, onTitleChange, onNotesChange, onDelete }: {
    item: PlanItem;
    goalTitle?: string;
    onStatusChange: (id: number, status: string) => void;
    onTitleChange: (id: number, title: string) => void;
    onNotesChange: (id: number, notes: string) => void;
    onDelete: (id: number) => void;
  }) => (
    <div data-testid={`plan-item-${item.id}`}>
      <span>{item.title}</span>
      <span data-testid={`status-${item.id}`}>{item.status}</span>
      <button onClick={() => onStatusChange(item.id, 'done')}>Mark Done</button>
      <button onClick={() => onStatusChange(item.id, 'in_progress')}>Start</button>
      <button onClick={() => onTitleChange(item.id, 'Updated Title')}>Update Title</button>
      <button onClick={() => onNotesChange(item.id, 'New notes')}>Update Notes</button>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  ),
}));

const mockPlanItems: PlanItem[] = [
  {
    id: 1,
    title: 'Task 1',
    status: 'todo',
    priority: 'medium',
    order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Task 2',
    status: 'in_progress',
    priority: 'high',
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Task 3',
    status: 'done',
    priority: 'low',
    order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockDailyPlan: DailyPlan = {
  id: 1,
  date: new Date().toISOString().split('T')[0],
  items: mockPlanItems,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('DailyPlanning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(plansApi.getDailyPlanByDate).mockResolvedValue(mockDailyPlan);
    vi.mocked(plansApi.createDailyPlan).mockResolvedValue(mockDailyPlan);
    vi.mocked(plansApi.addDailyPlanItem).mockImplementation(async (_, data) => ({
      id: Date.now(),
      title: data.title,
      status: 'todo',
      priority: 'medium',
      order: data.order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    vi.mocked(plansApi.updatePlanItem).mockResolvedValue(mockPlanItems[0]);
    vi.mocked(plansApi.deletePlanItem).mockResolvedValue(undefined);
    vi.mocked(goalsApi.getGoals).mockResolvedValue([]);
  });

  it('renders page header', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Daily Planning' })).toBeInTheDocument();
    });
  });

  it('renders DatePicker component', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    vi.mocked(plansApi.getDailyPlanByDate).mockImplementation(() => new Promise(() => {}));
    render(<DailyPlanning />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('loads plan for selected date on mount', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(plansApi.getDailyPlanByDate).toHaveBeenCalled();
    });
  });

  it('displays plan items grouped by status', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    expect(screen.getByText('In Progress (1)')).toBeInTheDocument();
    expect(screen.getByText('To Do (1)')).toBeInTheDocument();
    expect(screen.getByText('Done (1)')).toBeInTheDocument();
  });

  it('displays completion progress bar', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('1 of 3 done')).toBeInTheDocument();
    });
  });

  it('creates new plan when 404 returned', async () => {
    const notFoundError = { response: { status: 404 } };
    vi.mocked(plansApi.getDailyPlanByDate).mockRejectedValue(notFoundError);
    vi.mocked(plansApi.createDailyPlan).mockResolvedValue({ ...mockDailyPlan, items: [] });

    render(<DailyPlanning />);

    await waitFor(() => {
      expect(plansApi.createDailyPlan).toHaveBeenCalled();
    });
  });

  it('shows error when plan fails to load', async () => {
    vi.mocked(plansApi.getDailyPlanByDate).mockRejectedValue(new Error('Network error'));

    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load daily plan')).toBeInTheDocument();
    });
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('retries loading on Retry button click', async () => {
    vi.mocked(plansApi.getDailyPlanByDate).mockRejectedValue(new Error('Network error'));

    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    vi.mocked(plansApi.getDailyPlanByDate).mockResolvedValue(mockDailyPlan);
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
  });

  it('adds new item via form submission', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add a new item...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Add a new item...');
    fireEvent.change(input, { target: { value: 'New Task' } });
    fireEvent.click(screen.getByRole('button', { name: /Add/i }));

    await waitFor(() => {
      expect(plansApi.addDailyPlanItem).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ title: 'New Task' })
      );
    });
  });

  it('clears input after adding item', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add a new item...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Add a new item...');
    fireEvent.change(input, { target: { value: 'New Task' } });
    fireEvent.click(screen.getByRole('button', { name: /Add/i }));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('disables Add button when input is empty', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add/i })).toBeDisabled();
    });
  });

  it('updates item status', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    const markDoneButtons = screen.getAllByRole('button', { name: 'Mark Done' });
    fireEvent.click(markDoneButtons[0]);

    await waitFor(() => {
      expect(plansApi.updatePlanItem).toHaveBeenCalled();
    });
  });

  it('updates item title', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    const updateTitleButtons = screen.getAllByRole('button', { name: 'Update Title' });
    fireEvent.click(updateTitleButtons[0]);

    await waitFor(() => {
      expect(plansApi.updatePlanItem).toHaveBeenCalled();
    });
  });

  it('updates item notes', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    const updateNotesButtons = screen.getAllByRole('button', { name: 'Update Notes' });
    fireEvent.click(updateNotesButtons[0]);

    await waitFor(() => {
      expect(plansApi.updatePlanItem).toHaveBeenCalled();
    });
  });

  it('deletes item', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(plansApi.deletePlanItem).toHaveBeenCalled();
    });
  });

  it('loads new plan when date changes', async () => {
    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next Day' }));

    await waitFor(() => {
      // Should have been called twice: once on mount, once on date change
      expect(plansApi.getDailyPlanByDate).toHaveBeenCalledTimes(2);
    });
  });

  it('shows empty state when no items exist', async () => {
    vi.mocked(plansApi.getDailyPlanByDate).mockResolvedValue({ ...mockDailyPlan, items: [] });

    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('No items for this day')).toBeInTheDocument();
    });
    expect(screen.getByText('Add your first item above to start planning')).toBeInTheDocument();
  });

  it('shows error on status update failure', async () => {
    vi.mocked(plansApi.updatePlanItem).mockRejectedValue(new Error('Update failed'));

    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    const markDoneButtons = screen.getAllByRole('button', { name: 'Mark Done' });
    fireEvent.click(markDoneButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to update status')).toBeInTheDocument();
    });
  });

  it('shows error on delete failure', async () => {
    vi.mocked(plansApi.deletePlanItem).mockRejectedValue(new Error('Delete failed'));

    render(<DailyPlanning />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete item')).toBeInTheDocument();
    });
  });
});
