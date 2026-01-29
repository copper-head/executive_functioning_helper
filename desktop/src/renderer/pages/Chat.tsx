/**
 * @fileoverview Chat Page Component
 *
 * AI assistant chat interface with conversation management.
 * Supports multiple conversations with real-time streaming responses.
 *
 * @module pages/Chat
 */

import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import ConversationList from '../components/ConversationList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

/**
 * Chat page with conversation sidebar and message area.
 *
 * Layout:
 * - Left sidebar: Conversation list with new/select/delete actions
 * - Main area: Message display with streaming support and input
 *
 * Features:
 * - Browse and select past conversations
 * - Start new conversations
 * - Delete conversations
 * - Real-time streaming responses
 * - Error display with dismiss
 *
 * Route: /chat
 */
export default function Chat() {
  const {
    conversations,
    currentConversation,
    isLoadingConversations,
    isStreaming,
    streamingContent,
    error,
    fetchConversations,
    selectConversation,
    startNewConversation,
    deleteConversation,
    sendMessage,
    clearError,
  } = useChatStore();

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="flex h-full">
      {/* Conversation sidebar */}
      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        isLoading={isLoadingConversations}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        onNewConversation={startNewConversation}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Error banner (if any) */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={clearError}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Message list with streaming support */}
        <MessageList
          messages={currentConversation?.messages || []}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
        />

        {/* Message input - disabled while streaming */}
        <MessageInput
          onSend={sendMessage}
          disabled={isStreaming}
          placeholder={isStreaming ? 'Waiting for response...' : 'Type a message...'}
        />
      </div>
    </div>
  );
}
