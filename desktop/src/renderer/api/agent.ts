/**
 * @fileoverview AI Agent/Chat API Functions
 *
 * Provides functions for interacting with the AI chat agent, including
 * conversation management and real-time streaming chat responses.
 * Supports both standard request/response and Server-Sent Events (SSE)
 * streaming for progressive response display.
 *
 * @module api/agent
 */

import { apiClient, getStoredToken } from './client';

/**
 * Represents a single message in a conversation.
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** Who sent the message: 'user' for human input, 'assistant' for AI responses */
  role: 'user' | 'assistant';
  /** The text content of the message */
  content: string;
  /** ISO timestamp of when the message was created */
  created_at: string;
}

/**
 * Represents a chat conversation containing multiple messages.
 */
export interface Conversation {
  /** Unique identifier for the conversation */
  id: string;
  /** Display title for the conversation (may be auto-generated from first message) */
  title: string;
  /** Ordered list of messages in the conversation */
  messages: Message[];
  /** ISO timestamp of when the conversation was created */
  created_at: string;
  /** ISO timestamp of the last activity in the conversation */
  updated_at: string;
}

/**
 * Request payload for sending a chat message.
 */
export interface ChatRequest {
  /** The user's message text */
  message: string;
  /** Optional conversation ID to continue an existing conversation */
  conversation_id?: string;
}

/**
 * Response from a non-streaming chat request.
 */
export interface ChatResponse {
  /** The assistant's response message */
  message: Message;
  /** The conversation ID (new or existing) */
  conversation_id: string;
}

/**
 * Fetches all conversations for the current user.
 *
 * @returns Array of conversations, typically ordered by most recent activity
 */
export async function getConversations(): Promise<Conversation[]> {
  const response = await apiClient.get<Conversation[]>('/agent/conversations');
  return response.data;
}

/**
 * Fetches a specific conversation with all its messages.
 *
 * @param id - The conversation ID to fetch
 * @returns The conversation with its full message history
 */
export async function getConversation(id: string): Promise<Conversation> {
  const response = await apiClient.get<Conversation>(`/agent/conversations/${id}`);
  return response.data;
}

/**
 * Deletes a conversation and all its messages.
 *
 * @param id - The conversation ID to delete
 */
export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/agent/conversations/${id}`);
}

/**
 * Sends a chat message and receives a complete response.
 * Use this for simple request/response without streaming.
 *
 * @param data - The chat request containing the message and optional conversation ID
 * @returns The assistant's response and conversation ID
 */
export async function chat(data: ChatRequest): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>('/agent/chat', data);
  return response.data;
}

/**
 * Sends a chat message and streams the response in real-time.
 *
 * Uses Server-Sent Events (SSE) to receive progressive response chunks,
 * allowing the UI to display the response as it's being generated.
 * This provides a better user experience for longer responses.
 *
 * @param data - The chat request containing the message and optional conversation ID
 * @yields String chunks of the assistant's response as they arrive
 * @throws Error if the HTTP request fails or the response body is unavailable
 *
 * @example
 * ```typescript
 * let fullResponse = '';
 * for await (const chunk of chatStream({ message: 'Hello' })) {
 *   fullResponse += chunk;
 *   updateUI(fullResponse);
 * }
 * ```
 */
export async function* chatStream(data: ChatRequest): AsyncGenerator<string, void, unknown> {
  const token = getStoredToken();

  // Use native fetch for SSE support (Axios doesn't handle streaming well)
  const response = await fetch(
    `${apiClient.defaults.baseURL}/agent/chat/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  // Process the stream chunk by chunk
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Decode bytes and add to buffer for line-based parsing
    buffer += decoder.decode(value, { stream: true });

    // SSE uses newline-delimited messages
    const lines = buffer.split('\n');
    // Keep incomplete line in buffer for next iteration
    buffer = lines.pop() || '';

    for (const line of lines) {
      // SSE data lines are prefixed with "data: "
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        // "[DONE]" signals end of stream
        if (data === '[DONE]') return;
        yield data;
      }
    }
  }
}
