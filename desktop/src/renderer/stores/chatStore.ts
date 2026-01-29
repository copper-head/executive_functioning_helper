/**
 * @fileoverview Chat/Conversation State Store
 *
 * Global state management for AI chat functionality using Zustand.
 * Handles conversation listing, message history, and real-time
 * streaming responses. Provides optimistic updates for smooth UX.
 *
 * @module stores/chatStore
 */

import { create } from 'zustand';
import {
  Message,
  Conversation,
  getConversations,
  getConversation,
  deleteConversation as apiDeleteConversation,
  chatStream,
  ChatRequest,
} from '../api/agent';

/**
 * Chat state shape and actions.
 */
interface ChatState {
  /** List of all user conversations */
  conversations: Conversation[];
  /** Currently selected conversation (null for new conversation) */
  currentConversation: Conversation | null;
  /** True while fetching conversation list */
  isLoadingConversations: boolean;
  /** True while fetching conversation messages */
  isLoadingMessages: boolean;
  /** True while receiving streaming response */
  isStreaming: boolean;
  /** Accumulated content from current streaming response */
  streamingContent: string;
  /** Error message if an operation failed, null otherwise */
  error: string | null;

  /** Load all conversations from server */
  fetchConversations: () => Promise<void>;
  /** Select and load a specific conversation */
  selectConversation: (id: string) => Promise<void>;
  /** Clear current conversation to start fresh */
  startNewConversation: () => void;
  /** Delete a conversation by ID */
  deleteConversation: (id: string) => Promise<void>;
  /** Send a message and stream the response */
  sendMessage: (content: string) => Promise<void>;
  /** Clear any error state */
  clearError: () => void;
}

/**
 * Global chat store for AI conversation management.
 *
 * Usage in components:
 * ```typescript
 * const { conversations, sendMessage, isStreaming } = useChatStore();
 * ```
 *
 * Features:
 * - Optimistic UI updates (user message appears immediately)
 * - Real-time streaming response display
 * - Automatic conversation list refresh after sending
 */
export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state - empty until fetched
  conversations: [],
  currentConversation: null,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isStreaming: false,
  streamingContent: '',
  error: null,

  /**
   * Fetches all conversations for the sidebar list.
   */
  fetchConversations: async () => {
    set({ isLoadingConversations: true, error: null });
    try {
      const conversations = await getConversations();
      set({ conversations, isLoadingConversations: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load conversations',
        isLoadingConversations: false,
      });
    }
  },

  /**
   * Loads a specific conversation with its full message history.
   */
  selectConversation: async (id: string) => {
    set({ isLoadingMessages: true, error: null });
    try {
      const conversation = await getConversation(id);
      set({ currentConversation: conversation, isLoadingMessages: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load conversation',
        isLoadingMessages: false,
      });
    }
  },

  /**
   * Clears current conversation to start a new one.
   * User's next message will create a new conversation.
   */
  startNewConversation: () => {
    set({ currentConversation: null, streamingContent: '' });
  },

  /**
   * Deletes a conversation and updates local state.
   * If deleting the current conversation, clears selection.
   */
  deleteConversation: async (id: string) => {
    try {
      await apiDeleteConversation(id);
      const { conversations, currentConversation } = get();
      set({
        // Remove from list
        conversations: conversations.filter((c) => c.id !== id),
        // Clear selection if we deleted the current conversation
        currentConversation: currentConversation?.id === id ? null : currentConversation,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete conversation',
      });
    }
  },

  /**
   * Sends a user message and processes the streaming response.
   *
   * Flow:
   * 1. Optimistically add user message to UI
   * 2. Start streaming request
   * 3. Update streamingContent as chunks arrive
   * 4. On completion, add assistant message to conversation
   * 5. Refresh conversation list to update sidebar
   */
  sendMessage: async (content: string) => {
    const { currentConversation } = get();

    // Create optimistic user message with temporary ID
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    // Optimistically add user message to UI
    if (currentConversation) {
      // Add to existing conversation
      set({
        currentConversation: {
          ...currentConversation,
          messages: [...currentConversation.messages, userMessage],
        },
      });
    } else {
      // Create placeholder for new conversation
      set({
        currentConversation: {
          id: '',
          title: 'New Conversation',
          messages: [userMessage],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    // Start streaming
    set({ isStreaming: true, streamingContent: '', error: null });

    const request: ChatRequest = {
      message: content,
      conversation_id: currentConversation?.id || undefined,
    };

    try {
      // Accumulate streamed response chunks
      let fullContent = '';
      for await (const chunk of chatStream(request)) {
        fullContent += chunk;
        // Update UI progressively as content arrives
        set({ streamingContent: fullContent });
      }

      // Create assistant message from complete response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      };

      // Add assistant message to conversation
      const state = get();
      if (state.currentConversation) {
        set({
          currentConversation: {
            ...state.currentConversation,
            messages: [...state.currentConversation.messages, assistantMessage],
          },
          isStreaming: false,
          streamingContent: '',
        });
      }

      // Refresh conversation list (may have new conversation or updated title)
      await get().fetchConversations();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to send message',
        isStreaming: false,
        streamingContent: '',
      });
    }
  },

  /**
   * Clears any error state (e.g., after user dismisses error toast).
   */
  clearError: () => set({ error: null }),
}));
