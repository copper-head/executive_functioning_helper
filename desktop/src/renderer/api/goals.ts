/**
 * @fileoverview Goals API Functions
 *
 * Provides CRUD operations for user goals. Goals represent high-level
 * objectives that can be tracked over time and linked to daily/weekly
 * planning items.
 *
 * @module api/goals
 */

import { apiClient } from './client';

/**
 * Represents a user goal or objective.
 */
export interface Goal {
  /** Unique identifier for the goal */
  id: string;
  /** Brief title describing the goal */
  title: string;
  /** Optional detailed description of the goal */
  description?: string;
  /** Optional target completion date in ISO format */
  target_date?: string;
  /** Current status: active (in progress), completed, or archived (hidden but preserved) */
  status: 'active' | 'completed' | 'archived';
  /** Priority level (higher number = higher priority) */
  priority: number;
  /** ISO timestamp of goal creation */
  created_at: string;
  /** ISO timestamp of last update */
  updated_at: string;
}

/**
 * Request payload for creating a new goal.
 */
export interface CreateGoalRequest {
  /** Title for the new goal (required) */
  title: string;
  /** Optional detailed description */
  description?: string;
  /** Optional target completion date */
  target_date?: string;
  /** Optional priority level (defaults to server default if not specified) */
  priority?: number;
}

/**
 * Request payload for updating an existing goal.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateGoalRequest {
  /** New title for the goal */
  title?: string;
  /** New description */
  description?: string;
  /** New target date */
  target_date?: string;
  /** New status */
  status?: 'active' | 'completed' | 'archived';
  /** New priority level */
  priority?: number;
}

/**
 * Fetches all goals for the current user.
 *
 * @returns Array of goals, typically ordered by priority and creation date
 */
export async function getGoals(): Promise<Goal[]> {
  const response = await apiClient.get<Goal[]>('/goals');
  return response.data;
}

/**
 * Fetches a specific goal by its ID.
 *
 * @param id - The goal ID to fetch
 * @returns The requested goal
 * @throws Error if the goal doesn't exist or user lacks access
 */
export async function getGoal(id: string): Promise<Goal> {
  const response = await apiClient.get<Goal>(`/goals/${id}`);
  return response.data;
}

/**
 * Creates a new goal for the current user.
 *
 * @param data - The goal data including required title
 * @returns The newly created goal with server-assigned ID and timestamps
 */
export async function createGoal(data: CreateGoalRequest): Promise<Goal> {
  const response = await apiClient.post<Goal>('/goals', data);
  return response.data;
}

/**
 * Updates an existing goal with partial data.
 * Only the fields provided in the request will be modified.
 *
 * @param id - The goal ID to update
 * @param data - The fields to update
 * @returns The updated goal with new values
 */
export async function updateGoal(id: string, data: UpdateGoalRequest): Promise<Goal> {
  const response = await apiClient.patch<Goal>(`/goals/${id}`, data);
  return response.data;
}

/**
 * Permanently deletes a goal.
 * Consider using updateGoal with status='archived' to preserve history.
 *
 * @param id - The goal ID to delete
 */
export async function deleteGoal(id: string): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}
