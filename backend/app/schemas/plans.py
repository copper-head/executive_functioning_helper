"""
Planning Pydantic Schemas.

This module defines request/response schemas for planning endpoints
including weekly plans, daily plans, and plan items.
"""

from datetime import datetime, date
from pydantic import BaseModel
from app.db.models import PlanStatus, ItemStatus, Priority


# =============================================================================
# Weekly Plan Schemas
# =============================================================================


class WeeklyPlanCreate(BaseModel):
    """
    Schema for creating a new weekly plan.

    Attributes:
        week_start_date: The Monday of the plan week.
        summary: High-level overview of the week's focus.
        focus_areas: Key themes or priorities for the week.
    """
    week_start_date: date
    summary: str | None = None
    focus_areas: str | None = None


class WeeklyPlanUpdate(BaseModel):
    """
    Schema for updating a weekly plan (partial update).

    Attributes:
        summary: Updated week summary.
        focus_areas: Updated focus areas.
        status: New plan status (draft, active, completed).
    """
    summary: str | None = None
    focus_areas: str | None = None
    status: PlanStatus | None = None


class WeeklyPlanResponse(BaseModel):
    """
    Schema for weekly plan response data.

    Attributes:
        id: Unique identifier.
        week_start_date: The Monday of the plan week.
        summary: Week summary.
        focus_areas: Key themes for the week.
        status: Current plan status.
        created_at: When the plan was created.
        updated_at: When the plan was last modified.
    """
    id: int
    week_start_date: date
    summary: str | None
    focus_areas: str | None
    status: PlanStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Plan Item Schemas
# =============================================================================


class PlanItemCreate(BaseModel):
    """
    Schema for creating a new plan item (task).

    Attributes:
        title: Brief description of the task.
        notes: Additional details or context.
        goal_id: Optional link to a related goal.
        priority: Importance level.
        order: Position in the list (lower = higher).
    """
    title: str
    notes: str | None = None
    goal_id: int | None = None
    priority: Priority = Priority.MEDIUM
    order: int = 0


class PlanItemUpdate(BaseModel):
    """
    Schema for updating a plan item (partial update).

    Common use: updating status from todo -> in_progress -> done.

    Attributes:
        title: New task title.
        notes: New notes.
        goal_id: New goal link.
        status: New completion status.
        priority: New priority level.
        order: New position in list.
    """
    title: str | None = None
    notes: str | None = None
    goal_id: int | None = None
    status: ItemStatus | None = None
    priority: Priority | None = None
    order: int | None = None


class PlanItemResponse(BaseModel):
    """
    Schema for plan item response data.

    Attributes:
        id: Unique identifier.
        title: Task description.
        notes: Additional details.
        goal_id: Linked goal ID if any.
        status: Completion status.
        priority: Importance level.
        order: Position in list.
        created_at: When the item was created.
        updated_at: When the item was last modified.
    """
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


# =============================================================================
# Daily Plan Schemas
# =============================================================================


class DailyPlanCreate(BaseModel):
    """
    Schema for creating a new daily plan.

    Attributes:
        date: The calendar date for this plan.
        weekly_plan_id: Optional link to parent weekly plan.
        summary: Brief description of the day's focus.
    """
    date: date
    weekly_plan_id: int | None = None
    summary: str | None = None


class DailyPlanUpdate(BaseModel):
    """
    Schema for updating a daily plan (partial update).

    Attributes:
        summary: Updated day summary.
        status: New plan status.
        weekly_plan_id: New weekly plan link.
    """
    summary: str | None = None
    status: PlanStatus | None = None
    weekly_plan_id: int | None = None


class DailyPlanResponse(BaseModel):
    """
    Schema for daily plan response data.

    Includes nested list of all plan items.

    Attributes:
        id: Unique identifier.
        date: Calendar date.
        weekly_plan_id: Linked weekly plan ID if any.
        summary: Day summary.
        status: Current plan status.
        items: List of tasks for this day.
        created_at: When the plan was created.
        updated_at: When the plan was last modified.
    """
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
