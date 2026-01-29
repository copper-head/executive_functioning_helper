import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import { QuickActions } from './QuickActions';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('QuickActions', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders all quick action buttons', () => {
    render(<QuickActions />);

    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Daily Plan')).toBeInTheDocument();
  });

  it('renders section title', () => {
    render(<QuickActions />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('navigates to daily page when Add Item is clicked', () => {
    render(<QuickActions />);

    fireEvent.click(screen.getByText('Add Item'));

    expect(mockNavigate).toHaveBeenCalledWith('/daily');
  });

  it('navigates to chat page when Chat is clicked', () => {
    render(<QuickActions />);

    fireEvent.click(screen.getByText('Chat'));

    expect(mockNavigate).toHaveBeenCalledWith('/chat');
  });

  it('navigates to goals page when Goals is clicked', () => {
    render(<QuickActions />);

    fireEvent.click(screen.getByText('Goals'));

    expect(mockNavigate).toHaveBeenCalledWith('/goals');
  });

  it('navigates to daily page when Daily Plan is clicked', () => {
    render(<QuickActions />);

    fireEvent.click(screen.getByText('Daily Plan'));

    expect(mockNavigate).toHaveBeenCalledWith('/daily');
  });

  it('renders action buttons in a 2-column grid', () => {
    const { container } = render(<QuickActions />);

    const grid = container.querySelector('.grid.grid-cols-2');
    expect(grid).toBeInTheDocument();
  });

  it('renders all buttons as clickable', () => {
    render(<QuickActions />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);

    buttons.forEach(button => {
      expect(button).not.toBeDisabled();
    });
  });
});
