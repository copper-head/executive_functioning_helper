from datetime import datetime, date
from pydantic import BaseModel
from app.db.models import PlanStatus, ItemStatus, Priority


class WeeklyPlanCreate(BaseModel):
    week_start_date: date
    summary: str | None = None
    focus_areas: str | None = None


class WeeklyPlanUpdate(BaseModel):
    summary: str | None = None
    focus_areas: str | None = None
    status: PlanStatus | None = None


class WeeklyPlanResponse(BaseModel):
    id: int
    week_start_date: date
    summary: str | None
    focus_areas: str | None
    status: PlanStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlanItemCreate(BaseModel):
    title: str
    notes: str | None = None
    goal_id: int | None = None
    priority: Priority = Priority.MEDIUM
    order: int = 0


class PlanItemUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    goal_id: int | None = None
    status: ItemStatus | None = None
    priority: Priority | None = None
    order: int | None = None


class PlanItemResponse(BaseModel):
    id: int
    title: str
    notes: str | None
    goal_id: int | None
    status: ItemStatus
    priority: Priority
    order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DailyPlanCreate(BaseModel):
    date: date
    weekly_plan_id: int | None = None
    summary: str | None = None


class DailyPlanUpdate(BaseModel):
    summary: str | None = None
    status: PlanStatus | None = None
    weekly_plan_id: int | None = None


class DailyPlanResponse(BaseModel):
    id: int
    date: date
    weekly_plan_id: int | None
    summary: str | None
    status: PlanStatus
    items: list[PlanItemResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
