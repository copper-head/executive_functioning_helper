"""
Goals Pydantic Schemas.

This module defines request/response schemas for goal management endpoints.
"""

from datetime import datetime
from pydantic import BaseModel
from app.db.models import TimeHorizon, GoalStatus, Priority


class GoalCreate(BaseModel):
    """
    Schema for creating a new goal.

    Attributes:
        title: Brief description of the goal (required).
        description: Detailed explanation (optional).
        time_horizon: Expected timeframe - short, medium, or long.
        priority: Importance level - low, medium, high, or urgent.
    """
    title: str
    description: str | None = None
    time_horizon: TimeHorizon = TimeHorizon.SHORT
    priority: Priority = Priority.MEDIUM


class GoalUpdate(BaseModel):
    """
    Schema for updating an existing goal.

    All fields are optional - only provided fields are updated.

    Attributes:
        title: New title for the goal.
        description: New description.
        time_horizon: New time horizon.
        status: New status (active, completed, paused, cancelled).
        priority: New priority level.
    """
    title: str | None = None
    description: str | None = None
    time_horizon: TimeHorizon | None = None
    status: GoalStatus | None = None
    priority: Priority | None = None


class GoalResponse(BaseModel):
    """
    Schema for goal response data.

    Includes all goal fields plus timestamps.

    Attributes:
        id: Unique identifier.
        title: Goal title.
        description: Goal description.
        time_horizon: Expected timeframe.
        status: Current lifecycle status.
        priority: Importance level.
        created_at: When the goal was created.
        updated_at: When the goal was last modified.
    """
    id: int
    title: str
    description: str | None
    time_horizon: TimeHorizon
    status: GoalStatus
    priority: Priority
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
