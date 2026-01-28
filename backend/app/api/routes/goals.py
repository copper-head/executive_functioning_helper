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
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

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
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    await db.delete(goal)
    await db.commit()
