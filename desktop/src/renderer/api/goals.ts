import { apiClient } from './client';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: 'active' | 'completed' | 'archived';
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  target_date?: string;
  priority?: number;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  target_date?: string;
  status?: 'active' | 'completed' | 'archived';
  priority?: number;
}

export async function getGoals(): Promise<Goal[]> {
  const response = await apiClient.get<Goal[]>('/goals');
  return response.data;
}

export async function getGoal(id: string): Promise<Goal> {
  const response = await apiClient.get<Goal>(`/goals/${id}`);
  return response.data;
}

export async function createGoal(data: CreateGoalRequest): Promise<Goal> {
  const response = await apiClient.post<Goal>('/goals', data);
  return response.data;
}

export async function updateGoal(id: string, data: UpdateGoalRequest): Promise<Goal> {
  const response = await apiClient.patch<Goal>(`/goals/${id}`, data);
  return response.data;
}

export async function deleteGoal(id: string): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}
