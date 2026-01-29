/**
 * @fileoverview Chat Message List Component
 *
 * Displays a scrollable list of chat messages with auto-scroll
 * to show new messages. Supports both completed messages and
 * in-progress streaming responses.
 *
 * @module components/MessageList
 */

import { useEffect, useRef } from 'react';
import { Message } from '../api/agent';
import StreamingMessage from './StreamingMessage';

/**
 * Props for the MessageList component.
 */
interface MessageListProps {
  /** Array of messages to display */
  messages: Message[];
  /** Content of in-progress streaming response */
  streamingContent?: string;
  /** Whether a response is currently being streamed */
  isStreaming?: boolean;
}

/**
 * Individual message bubble with styling based on role.
 * User messages are right-aligned with blue background.
 * Assistant messages are left-aligned with gray background.
 */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        {/* whitespace-pre-wrap preserves newlines from message content */}
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}

/**
 * Scrollable message list with auto-scroll and empty state.
 *
 * Features:
 * - Auto-scrolls to bottom when new messages arrive
 * - Shows empty state prompt when no messages exist
 * - Displays streaming response with typing indicator
 *
 * @param props - Component props
 * @param props.messages - Array of messages to render
 * @param props.streamingContent - Partial content from ongoing stream
 * @param props.isStreaming - Whether to show streaming indicator
 */
export function MessageList({ messages, streamingContent, isStreaming }: MessageListProps) {
  // Ref for scroll target element at bottom of list
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change or streaming content updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Empty state - shown when no conversation has started
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm mt-1">Send a message to begin chatting with the AI assistant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Render all completed messages */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Show streaming response if active */}
      {isStreaming && streamingContent && (
        <StreamingMessage content={streamingContent} />
      )}

      {/* Invisible element at bottom for scroll targeting */}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
