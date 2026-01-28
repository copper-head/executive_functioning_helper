from datetime import datetime
from pydantic import BaseModel
from app.db.models import TimeHorizon, GoalStatus, Priority


class GoalCreate(BaseModel):
    title: str
    description: str | None = None
    time_horizon: TimeHorizon = TimeHorizon.SHORT
    priority: Priority = Priority.MEDIUM


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    time_horizon: TimeHorizon | None = None
    status: GoalStatus | None = None
    priority: Priority | None = None


class GoalResponse(BaseModel):
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
