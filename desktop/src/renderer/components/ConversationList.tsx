/**
 * @fileoverview Conversation List Sidebar Component
 *
 * Displays a list of chat conversations with selection, deletion,
 * and new conversation creation. Used in the Chat page sidebar.
 *
 * @module components/ConversationList
 */

import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { Conversation } from '../api/agent';

/**
 * Props for the ConversationList component.
 */
interface ConversationListProps {
  /** Array of conversations to display */
  conversations: Conversation[];
  /** ID of the currently selected conversation */
  currentConversationId?: string;
  /** Whether conversations are being loaded */
  isLoading?: boolean;
  /** Callback when a conversation is selected */
  onSelect: (id: string) => void;
  /** Callback when a conversation is deleted */
  onDelete: (id: string) => void;
  /** Callback to start a new conversation */
  onNewConversation: () => void;
}

/**
 * Individual conversation list item with hover-reveal delete button.
 */
function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  /**
   * Handles delete click, preventing event from bubbling to parent select handler.
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors group ${
        isActive
          ? 'bg-blue-50 text-blue-900'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <MessageSquare size={16} className="shrink-0" />
      <span className="flex-1 truncate">{conversation.title}</span>
      {/* Delete button appears on hover */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
        title="Delete conversation"
      >
        <Trash2 size={14} className="text-gray-500" />
      </button>
    </button>
  );
}

/**
 * Sidebar panel showing conversation history with management controls.
 *
 * Features:
 * - "New Chat" button at top to start fresh conversation
 * - Scrollable list of past conversations
 * - Active conversation highlighting
 * - Hover-reveal delete button on each conversation
 * - Loading and empty states
 *
 * @param props - Component props
 */
export function ConversationList({
  conversations,
  currentConversationId,
  isLoading,
  onSelect,
  onDelete,
  onNewConversation,
}: ConversationListProps) {
  return (
    <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50">
      {/* New Chat button */}
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="text-center py-4 text-sm text-gray-500">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No conversations yet
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === currentConversationId}
              onSelect={() => onSelect(conversation.id)}
              onDelete={() => onDelete(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ConversationList;
