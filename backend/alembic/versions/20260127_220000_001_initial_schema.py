"""Initial schema with all models.

Revision ID: 001
Revises:
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
    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Create goals table
    op.create_table(
        "goals",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("active", "completed", "archived", name="goalstatus"),
            nullable=False,
            default="active",
        ),
        sa.Column("target_date", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_goals_user_id", "goals", ["user_id"])

    # Create weekly_plans table
    op.create_table(
        "weekly_plans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("week_start", sa.DateTime(), nullable=False),
        sa.Column("week_end", sa.DateTime(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_weekly_plans_user_id", "weekly_plans", ["user_id"])

    # Create daily_plans table
    op.create_table(
        "daily_plans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_daily_plans_user_id", "daily_plans", ["user_id"])

    # Create plan_items table
    op.create_table(
        "plan_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "in_progress", "completed", "skipped", name="planitemstatus"
            ),
            nullable=False,
            default="pending",
        ),
        sa.Column("priority", sa.Integer(), nullable=False, default=0),
        sa.Column("estimated_minutes", sa.Integer(), nullable=True),
        sa.Column("actual_minutes", sa.Integer(), nullable=True),
        sa.Column("scheduled_time", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column(
            "goal_id",
            sa.String(36),
            sa.ForeignKey("goals.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "weekly_plan_id",
            sa.String(36),
            sa.ForeignKey("weekly_plans.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "daily_plan_id",
            sa.String(36),
            sa.ForeignKey("daily_plans.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.create_index("ix_plan_items_goal_id", "plan_items", ["goal_id"])
    op.create_index("ix_plan_items_weekly_plan_id", "plan_items", ["weekly_plan_id"])
    op.create_index("ix_plan_items_daily_plan_id", "plan_items", ["daily_plan_id"])

    # Create agent_conversations table
    op.create_table(
        "agent_conversations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_agent_conversations_user_id", "agent_conversations", ["user_id"]
    )

    # Create agent_messages table
    op.create_table(
        "agent_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.String(36),
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
    # Drop tables in reverse order of dependencies
    op.drop_index("ix_agent_messages_conversation_id", table_name="agent_messages")
    op.drop_table("agent_messages")

    op.drop_index("ix_agent_conversations_user_id", table_name="agent_conversations")
    op.drop_table("agent_conversations")

    op.drop_index("ix_plan_items_daily_plan_id", table_name="plan_items")
    op.drop_index("ix_plan_items_weekly_plan_id", table_name="plan_items")
    op.drop_index("ix_plan_items_goal_id", table_name="plan_items")
    op.drop_table("plan_items")

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
