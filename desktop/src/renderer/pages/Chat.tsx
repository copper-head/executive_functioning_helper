import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import ConversationList from '../components/ConversationList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

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

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="flex h-full">
      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        isLoading={isLoadingConversations}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        onNewConversation={startNewConversation}
      />
      <div className="flex-1 flex flex-col">
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
        <MessageList
          messages={currentConversation?.messages || []}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
        />
        <MessageInput
          onSend={sendMessage}
          disabled={isStreaming}
          placeholder={isStreaming ? 'Waiting for response...' : 'Type a message...'}
        />
      </div>
    </div>
  );
}
