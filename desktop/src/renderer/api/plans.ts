import { apiClient } from './client';

export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  goal_id?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPlan {
  id: string;
  week_start: string;
  week_end: string;
  items: PlanItem[];
  created_at: string;
  updated_at: string;
}

export interface DailyPlan {
  id: string;
  date: string;
  items: PlanItem[];
  weekly_plan_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanItemRequest {
  title: string;
  description?: string;
  goal_id?: string;
  order?: number;
}

export interface UpdatePlanItemRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  goal_id?: string;
  order?: number;
}

// Weekly Plans
export async function getWeeklyPlans(): Promise<WeeklyPlan[]> {
  const response = await apiClient.get<WeeklyPlan[]>('/plans/weekly');
  return response.data;
}

export async function getWeeklyPlan(id: string): Promise<WeeklyPlan> {
  const response = await apiClient.get<WeeklyPlan>(`/plans/weekly/${id}`);
  return response.data;
}

export async function getCurrentWeeklyPlan(): Promise<WeeklyPlan> {
  const response = await apiClient.get<WeeklyPlan>('/plans/weekly/current');
  return response.data;
}

export async function createWeeklyPlan(weekStart: string): Promise<WeeklyPlan> {
  const response = await apiClient.post<WeeklyPlan>('/plans/weekly', { week_start: weekStart });
  return response.data;
}

export async function deleteWeeklyPlan(id: string): Promise<void> {
  await apiClient.delete(`/plans/weekly/${id}`);
}

// Daily Plans
export async function getDailyPlans(): Promise<DailyPlan[]> {
  const response = await apiClient.get<DailyPlan[]>('/plans/daily');
  return response.data;
}

export async function getDailyPlan(id: string): Promise<DailyPlan> {
  const response = await apiClient.get<DailyPlan>(`/plans/daily/${id}`);
  return response.data;
}

export async function getTodayPlan(): Promise<DailyPlan> {
  const response = await apiClient.get<DailyPlan>('/plans/daily/today');
  return response.data;
}

export async function createDailyPlan(date: string, weeklyPlanId?: string): Promise<DailyPlan> {
  const response = await apiClient.post<DailyPlan>('/plans/daily', {
    date,
    weekly_plan_id: weeklyPlanId,
  });
  return response.data;
}

export async function deleteDailyPlan(id: string): Promise<void> {
  await apiClient.delete(`/plans/daily/${id}`);
}

// Plan Items
export async function addWeeklyPlanItem(planId: string, data: CreatePlanItemRequest): Promise<PlanItem> {
  const response = await apiClient.post<PlanItem>(`/plans/weekly/${planId}/items`, data);
  return response.data;
}

export async function addDailyPlanItem(planId: string, data: CreatePlanItemRequest): Promise<PlanItem> {
  const response = await apiClient.post<PlanItem>(`/plans/daily/${planId}/items`, data);
  return response.data;
}

export async function updatePlanItem(itemId: string, data: UpdatePlanItemRequest): Promise<PlanItem> {
  const response = await apiClient.patch<PlanItem>(`/plans/items/${itemId}`, data);
  return response.data;
}

export async function deletePlanItem(itemId: string): Promise<void> {
  await apiClient.delete(`/plans/items/${itemId}`);
}
