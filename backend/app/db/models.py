"""Database models for the Executive Functioning Helper."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all models."""

    pass


class PlanItemStatus(str, Enum):
    """Status of a plan item."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class GoalStatus(str, Enum):
    """Status of a goal."""

    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class MessageRole(str, Enum):
    """Role of a message in a conversation."""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid4())


class User(Base):
    """User model."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    goals: Mapped[list["Goal"]] = relationship(
        "Goal", back_populates="user", cascade="all, delete-orphan"
    )
    weekly_plans: Mapped[list["WeeklyPlan"]] = relationship(
        "WeeklyPlan", back_populates="user", cascade="all, delete-orphan"
    )
    daily_plans: Mapped[list["DailyPlan"]] = relationship(
        "DailyPlan", back_populates="user", cascade="all, delete-orphan"
    )
    conversations: Mapped[list["AgentConversation"]] = relationship(
        "AgentConversation", back_populates="user", cascade="all, delete-orphan"
    )


class Goal(Base):
    """Goal model for tracking user goals."""

    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[GoalStatus] = mapped_column(
        SQLEnum(GoalStatus), default=GoalStatus.ACTIVE, nullable=False
    )
    target_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="goals")
    plan_items: Mapped[list["PlanItem"]] = relationship(
        "PlanItem", back_populates="goal", cascade="all, delete-orphan"
    )


class WeeklyPlan(Base):
    """Weekly plan model."""

    __tablename__ = "weekly_plans"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    week_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    week_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="weekly_plans")
    items: Mapped[list["PlanItem"]] = relationship(
        "PlanItem",
        back_populates="weekly_plan",
        foreign_keys="PlanItem.weekly_plan_id",
        cascade="all, delete-orphan",
    )


class DailyPlan(Base):
    """Daily plan model."""

    __tablename__ = "daily_plans"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="daily_plans")
    items: Mapped[list["PlanItem"]] = relationship(
        "PlanItem",
        back_populates="daily_plan",
        foreign_keys="PlanItem.daily_plan_id",
        cascade="all, delete-orphan",
    )


class PlanItem(Base):
    """Plan item model for individual tasks within plans."""

    __tablename__ = "plan_items"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[PlanItemStatus] = mapped_column(
        SQLEnum(PlanItemStatus), default=PlanItemStatus.PENDING, nullable=False
    )
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    scheduled_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Foreign keys
    goal_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("goals.id", ondelete="SET NULL"), nullable=True
    )
    weekly_plan_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("weekly_plans.id", ondelete="CASCADE"), nullable=True
    )
    daily_plan_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("daily_plans.id", ondelete="CASCADE"), nullable=True
    )

    # Relationships
    goal: Mapped[Optional["Goal"]] = relationship("Goal", back_populates="plan_items")
    weekly_plan: Mapped[Optional["WeeklyPlan"]] = relationship(
        "WeeklyPlan", back_populates="items", foreign_keys=[weekly_plan_id]
    )
    daily_plan: Mapped[Optional["DailyPlan"]] = relationship(
        "DailyPlan", back_populates="items", foreign_keys=[daily_plan_id]
    )


class AgentConversation(Base):
    """Agent conversation model for tracking chat sessions."""

    __tablename__ = "agent_conversations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="conversations")
    messages: Mapped[list["AgentMessage"]] = relationship(
        "AgentMessage", back_populates="conversation", cascade="all, delete-orphan"
    )


class AgentMessage(Base):
    """Agent message model for individual messages in conversations."""

    __tablename__ = "agent_messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agent_conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[MessageRole] = mapped_column(
        SQLEnum(MessageRole), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    conversation: Mapped["AgentConversation"] = relationship(
        "AgentConversation", back_populates="messages"
    )
