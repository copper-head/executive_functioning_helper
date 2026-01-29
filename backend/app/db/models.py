"""
Database Models for the Executive Functioning Helper.

This module defines all SQLAlchemy ORM models representing the application's
data structure. The models support a hierarchical planning system:

    User
    ├── Goals (long-term objectives with priority and time horizon)
    ├── WeeklyPlans (high-level weekly planning with focus areas)
    │   └── DailyPlans (specific daily plans linked to weekly context)
    │       └── PlanItems (individual tasks/actions for a day)
    └── AgentConversations (AI chat history for executive functioning support)
        └── AgentMessages (individual messages in a conversation)

Relationships:
    - All entities belong to a User (user_id foreign key)
    - PlanItems can optionally link to Goals for tracking goal-related work
    - DailyPlans can optionally link to WeeklyPlans for hierarchical planning
    - Cascade deletes ensure referential integrity

Indexes:
    - user_id columns are indexed for efficient user-scoped queries
    - date/week_start_date indexed for time-based lookups
"""

from datetime import datetime, date
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Enum as SQLEnum, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TimeHorizon(str, Enum):
    """
    Time horizon classification for goals.

    Helps users organize goals by expected completion timeframe,
    enabling different planning strategies for each horizon.
    """
    SHORT = "short"    # Days to weeks
    MEDIUM = "medium"  # Weeks to months
    LONG = "long"      # Months to years


class GoalStatus(str, Enum):
    """
    Lifecycle status for goals.

    Goals progress through states as users work on them,
    allowing filtering and reporting on goal health.
    """
    ACTIVE = "active"        # Currently being worked on
    COMPLETED = "completed"  # Successfully achieved
    PAUSED = "paused"        # Temporarily on hold
    CANCELLED = "cancelled"  # Abandoned or no longer relevant


class PlanStatus(str, Enum):
    """
    Status for weekly and daily plans.

    Plans start as drafts during creation, become active when
    the user commits to them, and complete when the period ends.
    """
    DRAFT = "draft"        # Being created/edited
    ACTIVE = "active"      # Currently in progress
    COMPLETED = "completed"  # Period has ended


class ItemStatus(str, Enum):
    """
    Status for individual plan items (tasks).

    Represents the completion state of specific actions
    within a daily plan.
    """
    TODO = "todo"              # Not started
    IN_PROGRESS = "in_progress"  # Currently working on
    DONE = "done"              # Successfully completed
    SKIPPED = "skipped"        # Intentionally not done


class Priority(str, Enum):
    """
    Priority levels for goals and plan items.

    Used to help users focus on what matters most and
    make decisions when time is limited.
    """
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class MessageRole(str, Enum):
    """
    Role identifier for chat messages.

    Follows the standard LLM conversation format with
    user, assistant, and system message types.
    """
    USER = "user"          # Message from the user
    ASSISTANT = "assistant"  # Response from the AI
    SYSTEM = "system"      # System instructions (rarely stored)


class User(Base):
    """
    User account model.

    Represents a registered user in the system. All other entities
    (goals, plans, conversations) belong to a user and are cascade
    deleted when the user is removed.

    Attributes:
        id: Primary key, auto-incrementing integer.
        email: Unique email address used for authentication.
        password_hash: Bcrypt hash of the user's password.
        created_at: Timestamp when the account was created.
        updated_at: Timestamp of the last account modification.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships - cascade delete ensures cleanup when user is removed
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    weekly_plans: Mapped[list["WeeklyPlan"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    daily_plans: Mapped[list["DailyPlan"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    conversations: Mapped[list["AgentConversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Goal(Base):
    """
    User goal model.

    Represents a user's objective or aspiration that they're working toward.
    Goals provide context for daily planning and help connect individual
    tasks to larger purposes.

    Attributes:
        id: Primary key.
        user_id: Foreign key to owning user (indexed for efficient lookup).
        title: Brief description of the goal (max 500 chars).
        description: Optional detailed explanation of the goal.
        time_horizon: Expected timeframe (short/medium/long).
        status: Current state in the goal lifecycle.
        priority: Importance level for prioritization.
        created_at: When the goal was created.
        updated_at: When the goal was last modified.
    """
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
    # Plan items can reference this goal to track goal-related work
    plan_items: Mapped[list["PlanItem"]] = relationship(back_populates="goal")


class WeeklyPlan(Base):
    """
    Weekly planning model.

    Provides a high-level view of the week, capturing focus areas and
    themes without getting into daily specifics. Weekly plans help users
    maintain strategic perspective while daily plans handle execution.

    Attributes:
        id: Primary key.
        user_id: Foreign key to owning user.
        week_start_date: Monday of the plan week (indexed for time queries).
        summary: Overview of what the week is about.
        focus_areas: Key themes or priorities for the week.
        status: Draft while planning, active during the week, completed after.
        created_at: When the plan was created.
        updated_at: When the plan was last modified.
    """
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
    # Daily plans within this week can reference the weekly plan for context
    daily_plans: Mapped[list["DailyPlan"]] = relationship(back_populates="weekly_plan")


class DailyPlan(Base):
    """
    Daily planning model.

    The core unit of execution planning. Each daily plan contains a list
    of specific items (tasks) the user intends to accomplish that day.
    Can optionally link to a weekly plan for hierarchical context.

    Attributes:
        id: Primary key.
        user_id: Foreign key to owning user.
        date: The calendar date for this plan (indexed for lookups).
        weekly_plan_id: Optional link to parent weekly plan.
        summary: Brief description of the day's focus.
        status: Draft during planning, active during the day, completed after.
        created_at: When the plan was created.
        updated_at: When the plan was last modified.
    """
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
    # Items cascade delete when the daily plan is removed
    items: Mapped[list["PlanItem"]] = relationship(back_populates="daily_plan", cascade="all, delete-orphan")


class PlanItem(Base):
    """
    Individual task/action within a daily plan.

    Represents a specific action the user intends to take. Items can
    optionally link to goals to track which goal they contribute toward.
    The order field allows custom sorting within a day.

    Attributes:
        id: Primary key.
        daily_plan_id: Foreign key to parent daily plan.
        goal_id: Optional foreign key linking to a related goal.
        title: Brief description of the task (max 500 chars).
        notes: Optional additional details or context.
        status: Current completion state (todo, in_progress, done, skipped).
        priority: Importance level for prioritization.
        order: Integer for custom sorting (lower = higher in list).
        created_at: When the item was created.
        updated_at: When the item was last modified.
    """
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
    # Optional goal reference - SET NULL on goal deletion preserves the item
    goal: Mapped[Optional["Goal"]] = relationship(back_populates="plan_items")


class AgentConversation(Base):
    """
    AI conversation thread model.

    Represents a conversation between the user and the AI assistant.
    Conversations can be contextual (linked to daily planning, goal setting, etc.)
    to provide the AI with relevant information for better assistance.

    Attributes:
        id: Primary key.
        user_id: Foreign key to owning user.
        title: Auto-generated or user-provided title for the conversation.
        context_type: Type of context (e.g., 'daily_planning', 'goal_setting').
        context_id: Optional ID of the related entity (e.g., daily_plan_id).
        created_at: When the conversation started.
    """
    __tablename__ = "agent_conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    context_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    context_id: Mapped[Optional[int]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="conversations")
    # Messages cascade delete when conversation is removed
    messages: Mapped[list["AgentMessage"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")


class AgentMessage(Base):
    """
    Individual message within an AI conversation.

    Stores both user messages and AI responses, maintaining the full
    conversation history for context continuity.

    Attributes:
        id: Primary key.
        conversation_id: Foreign key to parent conversation.
        role: Who sent the message (user, assistant, or system).
        content: The message text content.
        created_at: When the message was created.
    """
    __tablename__ = "agent_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("agent_conversations.id"), index=True)
    role: Mapped[MessageRole] = mapped_column(SQLEnum(MessageRole))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    conversation: Mapped["AgentConversation"] = relationship(back_populates="messages")
