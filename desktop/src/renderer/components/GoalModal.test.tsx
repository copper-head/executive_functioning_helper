import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import { GoalModal } from './GoalModal';
import { Goal } from '../api/goals';

const mockGoal: Goal = {
  id: 'goal-1',
  title: 'Test Goal',
  description: 'Test description',
  status: 'active',
  priority: 3,
  target_date: '2024-04-01T00:00:00Z',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('GoalModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSave.mockClear();
    mockOnSave.mockResolvedValue(undefined);
  });

  it('does not render when not open', () => {
    render(
      <GoalModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByText('New Goal')).not.toBeInTheDocument();
  });

  it('renders new goal form when open without goal', () => {
    render(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('New Goal')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/target date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
  });

  it('renders edit goal form when goal is provided', () => {
    render(
      <GoalModal
        goal={mockGoal}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Edit Goal')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Goal')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('shows status field only when editing', () => {
    const { rerender } = render(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();

    rerender(
      <GoalModal
        goal={mockGoal}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it('shows validation error when title is empty', async () => {
    render(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByText('Create Goal');
    fireEvent.click(submitButton);

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave with form data when submitted', async () => {
    render(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Goal Title' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'New description' },
    });

    const submitButton = screen.getByText('Create Goal');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Goal Title',
          description: 'New description',
        })
      );
    });
  });

  it('calls onClose when cancel is clicked', () => {
    render(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking backdrop', () => {
    render(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking X button', () => {
    render(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('svg'));
    if (xButton) {
      fireEvent.click(xButton);
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows error message when save fails', async () => {
    mockOnSave.mockRejectedValue(new Error('Save failed'));

    render(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Title' },
    });

    const submitButton = screen.getByText('Create Goal');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('shows "Saving..." text while submitting', async () => {
    mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Title' },
    });

    const submitButton = screen.getByText('Create Goal');
    fireEvent.click(submitButton);

    expect(await screen.findByText('Saving...')).toBeInTheDocument();
  });

  it('disables form inputs while submitting', async () => {
    mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Title' },
    });

    const submitButton = screen.getByText('Create Goal');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeDisabled();
    });
  });

  it('resets form when reopened with different goal', () => {
    const { rerender } = render(
      <GoalModal
        goal={mockGoal}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue('Test Goal')).toBeInTheDocument();

    rerender(
      <GoalModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByDisplayValue('Test Goal')).not.toBeInTheDocument();
  });
});
