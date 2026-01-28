import { create } from 'zustand';
import {
  Message,
  Conversation,
  getConversations,
  getConversation,
  deleteConversation,
  chatStream,
  ChatRequest,
} from '../api/agent';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  fetchConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isStreaming: false,
  streamingContent: '',
  error: null,

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

  startNewConversation: () => {
    set({ currentConversation: null, streamingContent: '' });
  },

  deleteConversation: async (id: string) => {
    try {
      await deleteConversation(id);
      const { conversations, currentConversation } = get();
      set({
        conversations: conversations.filter((c) => c.id !== id),
        currentConversation: currentConversation?.id === id ? null : currentConversation,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete conversation',
      });
    }
  },

  sendMessage: async (content: string) => {
    const { currentConversation } = get();

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    if (currentConversation) {
      set({
        currentConversation: {
          ...currentConversation,
          messages: [...currentConversation.messages, userMessage],
        },
      });
    } else {
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

    set({ isStreaming: true, streamingContent: '', error: null });

    const request: ChatRequest = {
      message: content,
      conversation_id: currentConversation?.id || undefined,
    };

    try {
      let fullContent = '';
      for await (const chunk of chatStream(request)) {
        fullContent += chunk;
        set({ streamingContent: fullContent });
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      };

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

      await get().fetchConversations();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to send message',
        isStreaming: false,
        streamingContent: '',
      });
    }
  },

  clearError: () => set({ error: null }),
}));
