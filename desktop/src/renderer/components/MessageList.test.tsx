import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils';
import { MessageList } from './MessageList';
import type { Message } from '../api/agent';

vi.mock('./StreamingMessage', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="streaming-message">{content}</div>
  ),
}));

describe('MessageList', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello, how are you?',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'I am doing well, thank you!',
      created_at: new Date().toISOString(),
    },
  ];

  it('renders empty state when no messages', () => {
    render(<MessageList messages={[]} />);

    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    expect(screen.getByText(/send a message to begin/i)).toBeInTheDocument();
  });

  it('renders messages', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument();
  });

  it('applies correct styling for user messages', () => {
    render(<MessageList messages={[mockMessages[0]]} />);

    const messageContainer = screen.getByText('Hello, how are you?').closest('div[class*="max-w"]');
    expect(messageContainer).toHaveClass('bg-blue-600', 'text-white');
  });

  it('applies correct styling for assistant messages', () => {
    render(<MessageList messages={[mockMessages[1]]} />);

    const messageContainer = screen.getByText('I am doing well, thank you!').closest('div[class*="max-w"]');
    expect(messageContainer).toHaveClass('bg-gray-100', 'text-gray-900');
  });

  it('renders streaming message when streaming', () => {
    render(
      <MessageList
        messages={mockMessages}
        streamingContent="I am typing..."
        isStreaming={true}
      />
    );

    expect(screen.getByTestId('streaming-message')).toBeInTheDocument();
    expect(screen.getByText('I am typing...')).toBeInTheDocument();
  });

  it('does not render streaming message when not streaming', () => {
    render(
      <MessageList
        messages={mockMessages}
        streamingContent=""
        isStreaming={false}
      />
    );

    expect(screen.queryByTestId('streaming-message')).not.toBeInTheDocument();
  });

  it('does not show empty state while streaming', () => {
    render(
      <MessageList
        messages={[]}
        streamingContent="typing..."
        isStreaming={true}
      />
    );

    expect(screen.queryByText('Start a conversation')).not.toBeInTheDocument();
  });

  it('preserves whitespace in message content', () => {
    const messagesWithWhitespace: Message[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Line 1\nLine 2\nLine 3',
        created_at: new Date().toISOString(),
      },
    ];

    render(<MessageList messages={messagesWithWhitespace} />);

    const messageElement = screen.getByText(/Line 1/);
    expect(messageElement).toHaveClass('whitespace-pre-wrap');
  });
});
