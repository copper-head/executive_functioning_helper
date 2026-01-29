import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import Chat from './Chat';
import * as chatStore from '../stores/chatStore';
import type { Conversation, Message } from '../api/agent';

// Mock the chat store
vi.mock('../stores/chatStore', () => ({
  useChatStore: vi.fn(),
}));

// Mock child components
vi.mock('../components/ConversationList', () => ({
  default: ({ conversations, currentConversationId, isLoading, onSelect, onDelete, onNewConversation }: {
    conversations: Conversation[];
    currentConversationId?: string;
    isLoading: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onNewConversation: () => void;
  }) => (
    <div data-testid="conversation-list">
      {isLoading && <span data-testid="loading">Loading...</span>}
      <button onClick={onNewConversation}>New Conversation</button>
      {conversations.map((conv) => (
        <div key={conv.id} data-testid={`conversation-${conv.id}`}>
          <button onClick={() => onSelect(conv.id)}>{conv.title}</button>
          <button onClick={() => onDelete(conv.id)}>Delete</button>
          {currentConversationId === conv.id && <span data-testid="active">Active</span>}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../components/MessageList', () => ({
  default: ({ messages, streamingContent, isStreaming }: {
    messages: Message[];
    streamingContent: string;
    isStreaming: boolean;
  }) => (
    <div data-testid="message-list">
      {messages.map((msg) => (
        <div key={msg.id} data-testid={`message-${msg.id}`}>
          <span data-testid={`role-${msg.id}`}>{msg.role}</span>
          <span data-testid={`content-${msg.id}`}>{msg.content}</span>
        </div>
      ))}
      {isStreaming && (
        <div data-testid="streaming-message">
          <span data-testid="streaming-content">{streamingContent}</span>
        </div>
      )}
    </div>
  ),
}));

vi.mock('../components/MessageInput', () => ({
  default: ({ onSend, disabled, placeholder }: {
    onSend: (content: string) => void;
    disabled: boolean;
    placeholder: string;
  }) => (
    <div data-testid="message-input">
      <input
        data-testid="input-field"
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSend((e.target as HTMLInputElement).value);
          }
        }}
      />
      <button
        onClick={() => onSend('Test message')}
        disabled={disabled}
      >
        Send
      </button>
    </div>
  ),
}));

const mockMessages: Message[] = [
  { id: '1', role: 'user', content: 'Hello', created_at: new Date().toISOString() },
  { id: '2', role: 'assistant', content: 'Hi there!', created_at: new Date().toISOString() },
];

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'First Conversation',
    messages: mockMessages,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'conv-2',
    title: 'Second Conversation',
    messages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockFetchConversations = vi.fn();
const mockSelectConversation = vi.fn();
const mockStartNewConversation = vi.fn();
const mockDeleteConversation = vi.fn();
const mockSendMessage = vi.fn();
const mockClearError = vi.fn();

function setupMockStore(overrides: Partial<ReturnType<typeof chatStore.useChatStore>> = {}) {
  vi.mocked(chatStore.useChatStore).mockReturnValue({
    conversations: mockConversations,
    currentConversation: mockConversations[0],
    isLoadingConversations: false,
    isLoadingMessages: false,
    isStreaming: false,
    streamingContent: '',
    error: null,
    fetchConversations: mockFetchConversations,
    selectConversation: mockSelectConversation,
    startNewConversation: mockStartNewConversation,
    deleteConversation: mockDeleteConversation,
    sendMessage: mockSendMessage,
    clearError: mockClearError,
    ...overrides,
  });
}

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockStore();
  });

  it('renders conversation list', () => {
    render(<Chat />);

    expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
  });

  it('renders message list', () => {
    render(<Chat />);

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
  });

  it('renders message input', () => {
    render(<Chat />);

    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  it('fetches conversations on mount', () => {
    render(<Chat />);

    expect(mockFetchConversations).toHaveBeenCalledTimes(1);
  });

  it('displays conversations in list', () => {
    render(<Chat />);

    expect(screen.getByText('First Conversation')).toBeInTheDocument();
    expect(screen.getByText('Second Conversation')).toBeInTheDocument();
  });

  it('displays messages from current conversation', () => {
    render(<Chat />);

    expect(screen.getByTestId('content-1')).toHaveTextContent('Hello');
    expect(screen.getByTestId('content-2')).toHaveTextContent('Hi there!');
  });

  it('shows loading state for conversations', () => {
    setupMockStore({ isLoadingConversations: true });
    render(<Chat />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows empty message list when no current conversation', () => {
    setupMockStore({ currentConversation: null });
    render(<Chat />);

    expect(screen.queryByTestId('message-1')).not.toBeInTheDocument();
  });

  it('selects conversation when clicked', () => {
    render(<Chat />);

    fireEvent.click(screen.getByText('Second Conversation'));

    expect(mockSelectConversation).toHaveBeenCalledWith('conv-2');
  });

  it('starts new conversation when button clicked', () => {
    render(<Chat />);

    fireEvent.click(screen.getByRole('button', { name: 'New Conversation' }));

    expect(mockStartNewConversation).toHaveBeenCalled();
  });

  it('deletes conversation when delete clicked', () => {
    render(<Chat />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    expect(mockDeleteConversation).toHaveBeenCalledWith('conv-1');
  });

  it('sends message when send button clicked', () => {
    render(<Chat />);

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('disables input while streaming', () => {
    setupMockStore({ isStreaming: true });
    render(<Chat />);

    expect(screen.getByTestId('input-field')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('shows streaming content while streaming', () => {
    setupMockStore({
      isStreaming: true,
      streamingContent: 'Streaming response...',
    });
    render(<Chat />);

    expect(screen.getByTestId('streaming-message')).toBeInTheDocument();
    expect(screen.getByTestId('streaming-content')).toHaveTextContent('Streaming response...');
  });

  it('shows streaming placeholder in input', () => {
    setupMockStore({ isStreaming: true });
    render(<Chat />);

    expect(screen.getByPlaceholderText('Waiting for response...')).toBeInTheDocument();
  });

  it('shows normal placeholder when not streaming', () => {
    render(<Chat />);

    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('displays error message when error exists', () => {
    setupMockStore({ error: 'Failed to send message' });
    render(<Chat />);

    expect(screen.getByText('Failed to send message')).toBeInTheDocument();
  });

  it('shows dismiss button for errors', () => {
    setupMockStore({ error: 'Some error' });
    render(<Chat />);

    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('clears error when dismiss clicked', () => {
    setupMockStore({ error: 'Some error' });
    render(<Chat />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(mockClearError).toHaveBeenCalled();
  });

  it('marks current conversation as active in list', () => {
    render(<Chat />);

    expect(screen.getByTestId('active')).toBeInTheDocument();
    // Active marker should be under conv-1
    const conv1 = screen.getByTestId('conversation-conv-1');
    expect(conv1).toContainElement(screen.getByTestId('active'));
  });

  it('displays message roles correctly', () => {
    render(<Chat />);

    expect(screen.getByTestId('role-1')).toHaveTextContent('user');
    expect(screen.getByTestId('role-2')).toHaveTextContent('assistant');
  });
});
