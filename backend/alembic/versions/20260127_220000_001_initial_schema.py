"""
Initial Schema Migration.

This migration creates all database tables for the Executive Functioning Helper
application. Tables are created in dependency order to satisfy foreign key
constraints.

Table Creation Order:
    1. users - Base user accounts
    2. goals - User objectives
    3. weekly_plans - High-level weekly planning
    4. daily_plans - Day-specific plans (references weekly_plans)
    5. plan_items - Individual tasks (references daily_plans, goals)
    6. agent_conversations - AI chat threads
    7. agent_messages - Chat messages (references conversations)

Indexes:
    - All foreign key columns are indexed for efficient joins
    - Email indexed for login lookups
    - Date columns indexed for time-based queries

Enum Types:
    - timehorizon: short, medium, long
    - goalstatus: active, completed, paused, cancelled
    - planstatus: draft, active, completed
    - itemstatus: todo, in_progress, done, skipped
    - priority: low, medium, high, urgent
    - messagerole: user, assistant, system

Revision ID: 001
Revises: None (initial migration)
Create Date: 2026-01-27 22:00:00.000000+00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all database tables and indexes."""

    # Create users table - base entity for all user data
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Create goals table
    op.create_table(
        "goals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "time_horizon",
            sa.Enum("short", "medium", "long", name="timehorizon"),
            nullable=False,
            server_default="short",
        ),
        sa.Column(
            "status",
            sa.Enum("active", "completed", "paused", "cancelled", name="goalstatus"),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "priority",
            sa.Enum("low", "medium", "high", "urgent", name="priority"),
            nullable=False,
            server_default="medium",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_goals_user_id", "goals", ["user_id"])

    # Create weekly_plans table
    op.create_table(
        "weekly_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("week_start_date", sa.Date(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("focus_areas", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("draft", "active", "completed", name="planstatus"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_weekly_plans_user_id", "weekly_plans", ["user_id"])

    # Create daily_plans table
    op.create_table(
        "daily_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "weekly_plan_id",
            sa.Integer(),
            sa.ForeignKey("weekly_plans.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("draft", "active", "completed", name="planstatus"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_daily_plans_user_id", "daily_plans", ["user_id"])
    op.create_index("ix_daily_plans_weekly_plan_id", "daily_plans", ["weekly_plan_id"])

    # Create plan_items table
    op.create_table(
        "plan_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "daily_plan_id",
            sa.Integer(),
            sa.ForeignKey("daily_plans.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "goal_id",
            sa.Integer(),
            sa.ForeignKey("goals.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("todo", "in_progress", "done", "skipped", name="itemstatus"),
            nullable=False,
            server_default="todo",
        ),
        sa.Column(
            "priority",
            sa.Enum("low", "medium", "high", "urgent", name="priority"),
            nullable=False,
            server_default="medium",
        ),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_plan_items_goal_id", "plan_items", ["goal_id"])
    op.create_index("ix_plan_items_daily_plan_id", "plan_items", ["daily_plan_id"])

    # Create agent_conversations table
    op.create_table(
        "agent_conversations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("context_type", sa.String(50), nullable=True),
        sa.Column("context_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_agent_conversations_user_id", "agent_conversations", ["user_id"]
    )

    # Create agent_messages table
    op.create_table(
        "agent_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.Integer(),
            sa.ForeignKey("agent_conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "role",
            sa.Enum("user", "assistant", "system", name="messagerole"),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_agent_messages_conversation_id", "agent_messages", ["conversation_id"]
    )


def downgrade() -> None:
    """
    Drop all tables and enum types.

    Tables are dropped in reverse dependency order to avoid
    foreign key constraint violations.
    """
    # Drop tables in reverse order of dependencies
    op.drop_index("ix_agent_messages_conversation_id", table_name="agent_messages")
    op.drop_table("agent_messages")

    op.drop_index("ix_agent_conversations_user_id", table_name="agent_conversations")
    op.drop_table("agent_conversations")

    op.drop_index("ix_plan_items_daily_plan_id", table_name="plan_items")
    op.drop_index("ix_plan_items_goal_id", table_name="plan_items")
    op.drop_table("plan_items")

    op.drop_index("ix_daily_plans_weekly_plan_id", table_name="daily_plans")
    op.drop_index("ix_daily_plans_user_id", table_name="daily_plans")
    op.drop_table("daily_plans")

    op.drop_index("ix_weekly_plans_user_id", table_name="weekly_plans")
    op.drop_table("weekly_plans")

    op.drop_index("ix_goals_user_id", table_name="goals")
    op.drop_table("goals")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS messagerole")
    op.execute("DROP TYPE IF EXISTS planitemstatus")
    op.execute("DROP TYPE IF EXISTS goalstatus")
