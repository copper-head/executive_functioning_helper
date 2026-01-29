/**
 * @fileoverview Planning API Functions
 *
 * Provides functions for managing weekly and daily plans, including
 * plan creation, item management, and status updates. Plans organize
 * tasks hierarchically: Weekly plans contain items for the week,
 * and daily plans can be linked to weekly plans or stand alone.
 *
 * @module api/plans
 */

import { apiClient } from './client';

/**
 * Status of an individual plan item.
 * - 'todo': Not yet started
 * - 'in_progress': Currently being worked on
 * - 'done': Completed successfully
 * - 'skipped': Intentionally not completed (e.g., no longer relevant)
 */
export type ItemStatus = 'todo' | 'in_progress' | 'done' | 'skipped';

/**
 * Priority level for plan items.
 * Used for sorting and visual emphasis in the UI.
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Represents a single actionable item within a plan.
 */
export interface PlanItem {
  /** Unique identifier for the item */
  id: number;
  /** Brief description of what needs to be done */
  title: string;
  /** Optional additional details or context */
  notes?: string;
  /** Optional link to a parent goal this item contributes to */
  goal_id?: number;
  /** Current completion status */
  status: ItemStatus;
  /** Importance level */
  priority: Priority;
  /** Position in the list for manual ordering (lower = earlier) */
  order: number;
  /** ISO timestamp of creation */
  created_at: string;
  /** ISO timestamp of last update */
  updated_at: string;
}

/**
 * Represents a weekly planning container.
 * Holds items planned for a specific week.
 */
export interface WeeklyPlan {
  /** Unique identifier for the plan */
  id: string;
  /** ISO date string for the start of the week (typically Monday) */
  week_start: string;
  /** ISO date string for the end of the week (typically Sunday) */
  week_end: string;
  /** Items planned for this week */
  items: PlanItem[];
  /** ISO timestamp of plan creation */
  created_at: string;
  /** ISO timestamp of last update */
  updated_at: string;
}

/**
 * Status of a daily plan.
 * - 'draft': Plan is being built, not yet committed
 * - 'active': Plan is the current working plan
 * - 'completed': Day is over and plan is finalized
 */
export type PlanStatus = 'draft' | 'active' | 'completed';

/**
 * Represents a daily planning container.
 * Holds items planned for a specific day.
 */
export interface DailyPlan {
  /** Unique identifier for the plan */
  id: number;
  /** ISO date string for the planned day */
  date: string;
  /** Items planned for this day */
  items: PlanItem[];
  /** Optional link to a parent weekly plan */
  weekly_plan_id?: number;
  /** Optional end-of-day summary or reflection */
  summary?: string;
  /** Current status of the daily plan */
  status: PlanStatus;
  /** ISO timestamp of plan creation */
  created_at: string;
  /** ISO timestamp of last update */
  updated_at: string;
}

/**
 * Request payload for creating a new plan item.
 */
export interface CreatePlanItemRequest {
  /** Title for the new item (required) */
  title: string;
  /** Optional notes or details */
  notes?: string;
  /** Optional goal to link this item to */
  goal_id?: number;
  /** Optional priority (defaults to 'medium' if not specified) */
  priority?: Priority;
  /** Optional position in the list */
  order?: number;
}

/**
 * Request payload for updating an existing plan item.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdatePlanItemRequest {
  /** New title */
  title?: string;
  /** New notes */
  notes?: string;
  /** New status */
  status?: ItemStatus;
  /** New goal link (use null to unlink from goal) */
  goal_id?: number | null;
  /** New priority */
  priority?: Priority;
  /** New position in the list */
  order?: number;
}

// ============================================================================
// Weekly Plan Functions
// ============================================================================

/**
 * Fetches all weekly plans for the current user.
 *
 * @returns Array of weekly plans, typically ordered by week_start descending
 */
export async function getWeeklyPlans(): Promise<WeeklyPlan[]> {
  const response = await apiClient.get<WeeklyPlan[]>('/plans/weekly');
  return response.data;
}

/**
 * Fetches a specific weekly plan by its ID.
 *
 * @param id - The weekly plan ID to fetch
 * @returns The weekly plan with all its items
 */
export async function getWeeklyPlan(id: string): Promise<WeeklyPlan> {
  const response = await apiClient.get<WeeklyPlan>(`/plans/weekly/${id}`);
  return response.data;
}

/**
 * Fetches the weekly plan for the current week.
 * Creates a new plan if one doesn't exist for this week.
 *
 * @returns The current week's plan
 */
export async function getCurrentWeeklyPlan(): Promise<WeeklyPlan> {
  const response = await apiClient.get<WeeklyPlan>('/plans/weekly/current');
  return response.data;
}

/**
 * Creates a new weekly plan starting on the specified date.
 *
 * @param weekStart - ISO date string for the week start (typically Monday)
 * @returns The newly created weekly plan
 */
export async function createWeeklyPlan(weekStart: string): Promise<WeeklyPlan> {
  const response = await apiClient.post<WeeklyPlan>('/plans/weekly', { week_start: weekStart });
  return response.data;
}

/**
 * Permanently deletes a weekly plan and all its items.
 *
 * @param id - The weekly plan ID to delete
 */
export async function deleteWeeklyPlan(id: string): Promise<void> {
  await apiClient.delete(`/plans/weekly/${id}`);
}

// ============================================================================
// Daily Plan Functions
// ============================================================================

/**
 * Fetches all daily plans for the current user.
 *
 * @returns Array of daily plans, typically ordered by date descending
 */
export async function getDailyPlans(): Promise<DailyPlan[]> {
  const response = await apiClient.get<DailyPlan[]>('/plans/daily');
  return response.data;
}

/**
 * Fetches a specific daily plan by its ID.
 *
 * @param id - The daily plan ID to fetch
 * @returns The daily plan with all its items
 */
export async function getDailyPlan(id: string): Promise<DailyPlan> {
  const response = await apiClient.get<DailyPlan>(`/plans/daily/${id}`);
  return response.data;
}

/**
 * Fetches the daily plan for today.
 * Creates a new plan if one doesn't exist for today.
 *
 * @returns Today's plan
 */
export async function getTodayPlan(): Promise<DailyPlan> {
  const response = await apiClient.get<DailyPlan>('/plans/daily/today');
  return response.data;
}

/**
 * Fetches the daily plan for a specific date.
 *
 * @param date - ISO date string (YYYY-MM-DD) for the day to fetch
 * @returns The daily plan for the specified date
 */
export async function getDailyPlanByDate(date: string): Promise<DailyPlan> {
  const response = await apiClient.get<DailyPlan>(`/plans/daily/by-date/${date}`);
  return response.data;
}

/**
 * Creates a new daily plan for the specified date.
 *
 * @param date - ISO date string (YYYY-MM-DD) for the plan
 * @param weeklyPlanId - Optional weekly plan to link this daily plan to
 * @returns The newly created daily plan
 */
export async function createDailyPlan(date: string, weeklyPlanId?: string): Promise<DailyPlan> {
  const response = await apiClient.post<DailyPlan>('/plans/daily', {
    date,
    weekly_plan_id: weeklyPlanId,
  });
  return response.data;
}

/**
 * Permanently deletes a daily plan and all its items.
 *
 * @param id - The daily plan ID to delete
 */
export async function deleteDailyPlan(id: string): Promise<void> {
  await apiClient.delete(`/plans/daily/${id}`);
}

// ============================================================================
// Plan Item Functions (shared between weekly and daily plans)
// ============================================================================

/**
 * Adds a new item to a weekly plan.
 *
 * @param planId - The weekly plan ID to add the item to
 * @param data - The item data including required title
 * @returns The newly created plan item
 */
export async function addWeeklyPlanItem(planId: string, data: CreatePlanItemRequest): Promise<PlanItem> {
  const response = await apiClient.post<PlanItem>(`/plans/weekly/${planId}/items`, data);
  return response.data;
}

/**
 * Adds a new item to a daily plan.
 *
 * @param planId - The daily plan ID to add the item to
 * @param data - The item data including required title
 * @returns The newly created plan item
 */
export async function addDailyPlanItem(planId: string, data: CreatePlanItemRequest): Promise<PlanItem> {
  const response = await apiClient.post<PlanItem>(`/plans/daily/${planId}/items`, data);
  return response.data;
}

/**
 * Updates an existing plan item with partial data.
 * Works for items in both weekly and daily plans.
 *
 * @param itemId - The plan item ID to update
 * @param data - The fields to update
 * @returns The updated plan item
 */
export async function updatePlanItem(itemId: string, data: UpdatePlanItemRequest): Promise<PlanItem> {
  const response = await apiClient.patch<PlanItem>(`/plans/items/${itemId}`, data);
  return response.data;
}

/**
 * Permanently deletes a plan item.
 * Works for items in both weekly and daily plans.
 *
 * @param itemId - The plan item ID to delete
 */
export async function deletePlanItem(itemId: string): Promise<void> {
  await apiClient.delete(`/plans/items/${itemId}`);
}
