import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import { PlanItem } from './PlanItem';
import type { PlanItem as PlanItemType } from '../api/plans';

const mockItem: PlanItemType = {
  id: 1,
  title: 'Test task',
  notes: '',
  goal_id: undefined,
  status: 'todo',
  priority: 'medium',
  order: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('PlanItem', () => {
  const mockOnStatusChange = vi.fn();
  const mockOnTitleChange = vi.fn();
  const mockOnNotesChange = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    mockOnStatusChange.mockClear();
    mockOnTitleChange.mockClear();
    mockOnNotesChange.mockClear();
    mockOnDelete.mockClear();
  });

  it('renders item title', () => {
    render(
      <PlanItem
        item={mockItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('cycles status from todo to in_progress', () => {
    render(
      <PlanItem
        item={mockItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    const statusButton = screen.getByTitle(/status: todo/i);
    fireEvent.click(statusButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith(1, 'in_progress');
  });

  it('cycles status from in_progress to done', () => {
    const inProgressItem = { ...mockItem, status: 'in_progress' as const };
    render(
      <PlanItem
        item={inProgressItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    const statusButton = screen.getByTitle(/status: in_progress/i);
    fireEvent.click(statusButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith(1, 'done');
  });

  it('cycles status from done to todo', () => {
    const doneItem = { ...mockItem, status: 'done' as const };
    render(
      <PlanItem
        item={doneItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    const statusButton = screen.getByTitle(/status: done/i);
    fireEvent.click(statusButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith(1, 'todo');
  });

  it('shows strikethrough style when done', () => {
    const doneItem = { ...mockItem, status: 'done' as const };
    render(
      <PlanItem
        item={doneItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    const titleElement = screen.getByText('Test task');
    expect(titleElement).toHaveClass('line-through');
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <PlanItem
        item={mockItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTitle(/delete item/i);
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it('enters edit mode when clicking title', () => {
    render(
      <PlanItem
        item={mockItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Test task'));

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test task')).toBeInTheDocument();
  });

  it('saves title on blur', () => {
    render(
      <PlanItem
        item={mockItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Test task'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated task' } });
    fireEvent.blur(input);

    expect(mockOnTitleChange).toHaveBeenCalledWith(1, 'Updated task');
  });

  it('saves title on Enter key', () => {
    render(
      <PlanItem
        item={mockItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Test task'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated task' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnTitleChange).toHaveBeenCalledWith(1, 'Updated task');
  });

  it('cancels edit on Escape key', () => {
    render(
      <PlanItem
        item={mockItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Test task'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated task' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(mockOnTitleChange).not.toHaveBeenCalled();
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('displays goal title when provided', () => {
    render(
      <PlanItem
        item={mockItem}
        goalTitle="Test Goal"
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Goal')).toBeInTheDocument();
  });

  it('shows "Add notes" button when no notes', () => {
    render(
      <PlanItem
        item={mockItem}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('+ Add notes')).toBeInTheDocument();
  });

  it('shows notes textarea when item has notes', () => {
    const itemWithNotes = { ...mockItem, notes: 'Some notes here' };
    render(
      <PlanItem
        item={itemWithNotes}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByDisplayValue('Some notes here')).toBeInTheDocument();
  });

  it('calls onNotesChange when notes are updated', () => {
    const itemWithNotes = { ...mockItem, notes: 'Some notes' };
    render(
      <PlanItem
        item={itemWithNotes}
        onStatusChange={mockOnStatusChange}
        onTitleChange={mockOnTitleChange}
        onNotesChange={mockOnNotesChange}
        onDelete={mockOnDelete}
      />
    );

    const textarea = screen.getByDisplayValue('Some notes');
    fireEvent.change(textarea, { target: { value: 'Updated notes' } });
    fireEvent.blur(textarea);

    expect(mockOnNotesChange).toHaveBeenCalledWith(1, 'Updated notes');
  });
});
