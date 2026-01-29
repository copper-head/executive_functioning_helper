import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import { MessageInput } from './MessageInput';

describe('MessageInput', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  it('renders textarea with placeholder', () => {
    render(<MessageInput onSend={mockOnSend} />);

    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<MessageInput onSend={mockOnSend} placeholder="Ask a question..." />);

    expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
  });

  it('calls onSend when form is submitted', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    const submitButton = screen.getByRole('button');
    fireEvent.click(submitButton);

    expect(mockOnSend).toHaveBeenCalledWith('Hello');
  });

  it('clears input after sending', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    const submitButton = screen.getByRole('button');
    fireEvent.click(submitButton);

    expect(textarea).toHaveValue('');
  });

  it('does not send empty messages', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const submitButton = screen.getByRole('button');
    fireEvent.click(submitButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('does not send whitespace-only messages', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '   ' } });

    const submitButton = screen.getByRole('button');
    fireEvent.click(submitButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('sends on Enter key press', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(mockOnSend).toHaveBeenCalledWith('Hello');
  });

  it('does not send on Shift+Enter (allows newline)', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<MessageInput onSend={mockOnSend} disabled={true} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('disables submit button when disabled', () => {
    render(<MessageInput onSend={mockOnSend} disabled={true} />);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when message is empty', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when message has content', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    const submitButton = screen.getByRole('button');
    expect(submitButton).not.toBeDisabled();
  });

  it('trims message before sending', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '  Hello World  ' } });

    const submitButton = screen.getByRole('button');
    fireEvent.click(submitButton);

    expect(mockOnSend).toHaveBeenCalledWith('Hello World');
  });

  it('does not send when disabled even with valid message', () => {
    render(<MessageInput onSend={mockOnSend} disabled={true} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(mockOnSend).not.toHaveBeenCalled();
  });
});
