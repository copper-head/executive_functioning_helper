"""
Goals API Routes.

This module provides CRUD endpoints for managing user goals:
- GET /: List all goals for the current user
- POST /: Create a new goal
- GET /{goal_id}: Get a specific goal
- PATCH /{goal_id}: Update a goal
- DELETE /{goal_id}: Delete a goal

Goals represent user objectives with associated metadata like time horizon,
priority, and status. They can be linked to daily plan items to track
which tasks contribute to which goals.

All endpoints require authentication and automatically scope queries
to the authenticated user's goals.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import User, Goal
from app.schemas.goals import GoalCreate, GoalUpdate, GoalResponse
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=list[GoalResponse])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all goals for the current user.

    Returns goals ordered by creation date (newest first).

    Args:
        current_user: The authenticated user.
        db: Database session.

    Returns:
        list[GoalResponse]: All goals belonging to the user.
    """
    result = await db.execute(
        select(Goal).where(Goal.user_id == current_user.id).order_by(Goal.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_in: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new goal.

    Args:
        goal_in: Goal creation data (title, description, time_horizon, priority).
        current_user: The authenticated user (goal owner).
        db: Database session.

    Returns:
        GoalResponse: The newly created goal.
    """
    goal = Goal(
        user_id=current_user.id,
        title=goal_in.title,
        description=goal_in.description,
        time_horizon=goal_in.time_horizon,
        priority=goal_in.priority,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific goal by ID.

    Args:
        goal_id: The goal's unique identifier.
        current_user: The authenticated user.
        db: Database session.

    Returns:
        GoalResponse: The requested goal.

    Raises:
        HTTPException: 404 if goal not found or doesn't belong to user.
    """
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    return goal


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_in: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a goal's properties.

    Only fields provided in the request body are updated (partial update).

    Args:
        goal_id: The goal's unique identifier.
        goal_in: Fields to update (all optional).
        current_user: The authenticated user.
        db: Database session.

    Returns:
        GoalResponse: The updated goal.

    Raises:
        HTTPException: 404 if goal not found or doesn't belong to user.
    """
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    # Only update fields that were explicitly provided
    update_data = goal_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a goal.

    Plan items linked to this goal will have their goal_id set to NULL
    (preserving the item but removing the goal reference).

    Args:
        goal_id: The goal's unique identifier.
        current_user: The authenticated user.
        db: Database session.

    Raises:
        HTTPException: 404 if goal not found or doesn't belong to user.
    """
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    await db.delete(goal)
    await db.commit()
