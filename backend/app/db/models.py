from datetime import datetime, date
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Enum as SQLEnum, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TimeHorizon(str, Enum):
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"


class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class PlanStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"


class ItemStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    SKIPPED = "skipped"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    weekly_plans: Mapped[list["WeeklyPlan"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    daily_plans: Mapped[list["DailyPlan"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    conversations: Mapped[list["AgentConversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    time_horizon: Mapped[TimeHorizon] = mapped_column(SQLEnum(TimeHorizon), default=TimeHorizon.SHORT)
    status: Mapped[GoalStatus] = mapped_column(SQLEnum(GoalStatus), default=GoalStatus.ACTIVE)
    priority: Mapped[Priority] = mapped_column(SQLEnum(Priority), default=Priority.MEDIUM)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="goals")
    plan_items: Mapped[list["PlanItem"]] = relationship(back_populates="goal")


class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    week_start_date: Mapped[date] = mapped_column(Date, index=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    focus_areas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[PlanStatus] = mapped_column(SQLEnum(PlanStatus), default=PlanStatus.DRAFT)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="weekly_plans")
    daily_plans: Mapped[list["DailyPlan"]] = relationship(back_populates="weekly_plan")


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    weekly_plan_id: Mapped[Optional[int]] = mapped_column(ForeignKey("weekly_plans.id"), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[PlanStatus] = mapped_column(SQLEnum(PlanStatus), default=PlanStatus.DRAFT)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="daily_plans")
    weekly_plan: Mapped[Optional["WeeklyPlan"]] = relationship(back_populates="daily_plans")
    items: Mapped[list["PlanItem"]] = relationship(back_populates="daily_plan", cascade="all, delete-orphan")


class PlanItem(Base):
    __tablename__ = "plan_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    daily_plan_id: Mapped[int] = mapped_column(ForeignKey("daily_plans.id"), index=True)
    goal_id: Mapped[Optional[int]] = mapped_column(ForeignKey("goals.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(500))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ItemStatus] = mapped_column(SQLEnum(ItemStatus), default=ItemStatus.TODO)
    priority: Mapped[Priority] = mapped_column(SQLEnum(Priority), default=Priority.MEDIUM)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    daily_plan: Mapped["DailyPlan"] = relationship(back_populates="items")
    goal: Mapped[Optional["Goal"]] = relationship(back_populates="plan_items")


class AgentConversation(Base):
    __tablename__ = "agent_conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    context_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    context_id: Mapped[Optional[int]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[list["AgentMessage"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")


class AgentMessage(Base):
    __tablename__ = "agent_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("agent_conversations.id"), index=True)
    role: Mapped[MessageRole] = mapped_column(SQLEnum(MessageRole))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    conversation: Mapped["AgentConversation"] = relationship(back_populates="messages")
