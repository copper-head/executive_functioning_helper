import { apiClient } from './client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: Message;
  conversation_id: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const response = await apiClient.get<Conversation[]>('/agent/conversations');
  return response.data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await apiClient.get<Conversation>(`/agent/conversations/${id}`);
  return response.data;
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/agent/conversations/${id}`);
}

export async function chat(data: ChatRequest): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>('/agent/chat', data);
  return response.data;
}

export async function* chatStream(data: ChatRequest): AsyncGenerator<string, void, unknown> {
  const response = await fetch(
    `${apiClient.defaults.baseURL}/agent/chat/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiClient.defaults.headers.Authorization as string || '',
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        yield data;
      }
    }
  }
}
