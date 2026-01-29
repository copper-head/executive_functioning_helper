"""
Planning API Routes.

This module provides endpoints for hierarchical planning:

Weekly Plans:
    - GET /weekly: List weekly plans
    - POST /weekly: Create a weekly plan
    - GET /weekly/{plan_id}: Get a weekly plan
    - PATCH /weekly/{plan_id}: Update a weekly plan
    - DELETE /weekly/{plan_id}: Delete a weekly plan

Daily Plans:
    - GET /daily: List daily plans (with optional date filtering)
    - POST /daily: Create a daily plan
    - GET /daily/{plan_id}: Get a daily plan with items
    - GET /daily/by-date/{plan_date}: Get daily plan for a specific date
    - PATCH /daily/{plan_id}: Update a daily plan
    - DELETE /daily/{plan_id}: Delete a daily plan

Plan Items:
    - POST /daily/{plan_id}/items: Add item to a daily plan
    - PATCH /items/{item_id}: Update a plan item
    - DELETE /items/{item_id}: Delete a plan item

The planning hierarchy flows: Weekly Plans -> Daily Plans -> Plan Items.
This structure helps users maintain strategic perspective while managing
day-to-day execution.
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import User, WeeklyPlan, DailyPlan, PlanItem
from app.schemas.plans import (
    WeeklyPlanCreate, WeeklyPlanUpdate, WeeklyPlanResponse,
    DailyPlanCreate, DailyPlanUpdate, DailyPlanResponse,
    PlanItemCreate, PlanItemUpdate, PlanItemResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


# =============================================================================
# Weekly Plans
# =============================================================================


@router.get("/weekly", response_model=list[WeeklyPlanResponse])
async def list_weekly_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all weekly plans for the current user.

    Returns plans ordered by week start date (newest first).

    Args:
        current_user: The authenticated user.
        db: Database session.

    Returns:
        list[WeeklyPlanResponse]: All weekly plans for the user.
    """
    result = await db.execute(
        select(WeeklyPlan)
        .where(WeeklyPlan.user_id == current_user.id)
        .order_by(WeeklyPlan.week_start_date.desc())
    )
    return result.scalars().all()


@router.post("/weekly", response_model=WeeklyPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_weekly_plan(
    plan_in: WeeklyPlanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new weekly plan.

    Args:
        plan_in: Weekly plan data (week_start_date, summary, focus_areas).
        current_user: The authenticated user.
        db: Database session.

    Returns:
        WeeklyPlanResponse: The newly created weekly plan.
    """
    plan = WeeklyPlan(
        user_id=current_user.id,
        week_start_date=plan_in.week_start_date,
        summary=plan_in.summary,
        focus_areas=plan_in.focus_areas,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/weekly/{plan_id}", response_model=WeeklyPlanResponse)
async def get_weekly_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific weekly plan by ID.

    Args:
        plan_id: The weekly plan's unique identifier.
        current_user: The authenticated user.
        db: Database session.

    Returns:
        WeeklyPlanResponse: The requested weekly plan.

    Raises:
        HTTPException: 404 if plan not found or doesn't belong to user.
    """
    result = await db.execute(
        select(WeeklyPlan).where(WeeklyPlan.id == plan_id, WeeklyPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly plan not found")

    return plan


@router.patch("/weekly/{plan_id}", response_model=WeeklyPlanResponse)
async def update_weekly_plan(
    plan_id: int,
    plan_in: WeeklyPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a weekly plan's properties.

    Only fields provided in the request body are updated (partial update).

    Args:
        plan_id: The weekly plan's unique identifier.
        plan_in: Fields to update (all optional).
        current_user: The authenticated user.
        db: Database session.

    Returns:
        WeeklyPlanResponse: The updated weekly plan.

    Raises:
        HTTPException: 404 if plan not found or doesn't belong to user.
    """
    result = await db.execute(
        select(WeeklyPlan).where(WeeklyPlan.id == plan_id, WeeklyPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly plan not found")

    update_data = plan_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    await db.commit()
    await db.refresh(plan)
    return plan


@router.delete("/weekly/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_weekly_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a weekly plan.

    Daily plans linked to this weekly plan will have their weekly_plan_id
    set to NULL (preserving the daily plan but removing the link).

    Args:
        plan_id: The weekly plan's unique identifier.
        current_user: The authenticated user.
        db: Database session.

    Raises:
        HTTPException: 404 if plan not found or doesn't belong to user.
    """
    result = await db.execute(
        select(WeeklyPlan).where(WeeklyPlan.id == plan_id, WeeklyPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly plan not found")

    await db.delete(plan)
    await db.commit()


# =============================================================================
# Daily Plans
# =============================================================================


@router.get("/daily", response_model=list[DailyPlanResponse])
async def list_daily_plans(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List daily plans for the current user.

    Supports optional date range filtering. Results are ordered by date
    (newest first) and include all plan items.

    Args:
        start_date: Optional filter for plans on or after this date.
        end_date: Optional filter for plans on or before this date.
        current_user: The authenticated user.
        db: Database session.

    Returns:
        list[DailyPlanResponse]: Daily plans matching the filter criteria.
    """
    query = (
        select(DailyPlan)
        .where(DailyPlan.user_id == current_user.id)
        .options(selectinload(DailyPlan.items))
        .order_by(DailyPlan.date.desc())
    )

    # Apply optional date filters
    if start_date:
        query = query.where(DailyPlan.date >= start_date)
    if end_date:
        query = query.where(DailyPlan.date <= end_date)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/daily", response_model=DailyPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_daily_plan(
    plan_in: DailyPlanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new daily plan.

    Args:
        plan_in: Daily plan data (date, optional weekly_plan_id, optional summary).
        current_user: The authenticated user.
        db: Database session.

    Returns:
        DailyPlanResponse: The newly created daily plan with empty items list.
    """
    plan = DailyPlan(
        user_id=current_user.id,
        date=plan_in.date,
        weekly_plan_id=plan_in.weekly_plan_id,
        summary=plan_in.summary,
    )
    db.add(plan)
    await db.commit()

    # Re-fetch with items relationship loaded
    result = await db.execute(
        select(DailyPlan)
        .where(DailyPlan.id == plan.id)
        .options(selectinload(DailyPlan.items))
    )
    return result.scalar_one()


@router.get("/daily/{plan_id}", response_model=DailyPlanResponse)
async def get_daily_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific daily plan by ID.

    Includes all plan items in the response.

    Args:
        plan_id: The daily plan's unique identifier.
        current_user: The authenticated user.
        db: Database session.

    Returns:
        DailyPlanResponse: The requested daily plan with items.

    Raises:
        HTTPException: 404 if plan not found or doesn't belong to user.
    """
    result = await db.execute(
        select(DailyPlan)
        .where(DailyPlan.id == plan_id, DailyPlan.user_id == current_user.id)
        .options(selectinload(DailyPlan.items))
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily plan not found")

    return plan


@router.get("/daily/by-date/{plan_date}", response_model=DailyPlanResponse)
async def get_daily_plan_by_date(
    plan_date: date,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the daily plan for a specific calendar date.

    If multiple plans exist for the same date (edge case), returns
    the most recently created one.

    Args:
        plan_date: The calendar date to look up (YYYY-MM-DD format).
        current_user: The authenticated user.
        db: Database session.

    Returns:
        DailyPlanResponse: The daily plan for the specified date.

    Raises:
        HTTPException: 404 if no plan exists for that date.
    """
    result = await db.execute(
        select(DailyPlan)
        .where(DailyPlan.date == plan_date, DailyPlan.user_id == current_user.id)
        .order_by(DailyPlan.created_at.desc())
        .options(selectinload(DailyPlan.items))
    )
    plan = result.scalars().first()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily plan not found for this date")

    return plan


@router.patch("/daily/{plan_id}", response_model=DailyPlanResponse)
async def update_daily_plan(
    plan_id: int,
    plan_in: DailyPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a daily plan's properties.

    Only fields provided in the request body are updated (partial update).
    Does not modify plan items - use the item endpoints for that.

    Args:
        plan_id: The daily plan's unique identifier.
        plan_in: Fields to update (all optional).
        current_user: The authenticated user.
        db: Database session.

    Returns:
        DailyPlanResponse: The updated daily plan with items.

    Raises:
        HTTPException: 404 if plan not found or doesn't belong to user.
    """
    result = await db.execute(
        select(DailyPlan)
        .where(DailyPlan.id == plan_id, DailyPlan.user_id == current_user.id)
        .options(selectinload(DailyPlan.items))
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily plan not found")

    update_data = plan_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    await db.commit()

    # Reload with items to avoid greenlet issues
    result = await db.execute(
        select(DailyPlan)
        .where(DailyPlan.id == plan_id)
        .options(selectinload(DailyPlan.items))
    )
    return result.scalar_one()


@router.delete("/daily/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_daily_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a daily plan and all its items.

    Plan items are cascade deleted along with the plan.

    Args:
        plan_id: The daily plan's unique identifier.
        current_user: The authenticated user.
        db: Database session.

    Raises:
        HTTPException: 404 if plan not found or doesn't belong to user.
    """
    result = await db.execute(
        select(DailyPlan).where(DailyPlan.id == plan_id, DailyPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily plan not found")

    await db.delete(plan)
    await db.commit()


# =============================================================================
# Plan Items
# =============================================================================


@router.post("/daily/{plan_id}/items", response_model=PlanItemResponse, status_code=status.HTTP_201_CREATED)
async def create_plan_item(
    plan_id: int,
    item_in: PlanItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a new item to a daily plan.

    Items can optionally be linked to a goal to track which goal
    the task contributes toward.

    Args:
        plan_id: The daily plan to add the item to.
        item_in: Item data (title, notes, goal_id, priority, order).
        current_user: The authenticated user.
        db: Database session.

    Returns:
        PlanItemResponse: The newly created plan item.

    Raises:
        HTTPException: 404 if daily plan not found or doesn't belong to user.
    """
    # Verify the daily plan exists and belongs to the user
    result = await db.execute(
        select(DailyPlan).where(DailyPlan.id == plan_id, DailyPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily plan not found")

    item = PlanItem(
        daily_plan_id=plan_id,
        title=item_in.title,
        notes=item_in.notes,
        goal_id=item_in.goal_id,
        priority=item_in.priority,
        order=item_in.order,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/items/{item_id}", response_model=PlanItemResponse)
async def update_plan_item(
    item_id: int,
    item_in: PlanItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a plan item's properties.

    Common use case is updating status (todo -> in_progress -> done).
    Only fields provided in the request body are updated.

    Args:
        item_id: The plan item's unique identifier.
        item_in: Fields to update (all optional).
        current_user: The authenticated user.
        db: Database session.

    Returns:
        PlanItemResponse: The updated plan item.

    Raises:
        HTTPException: 404 if item not found or doesn't belong to user.
    """
    # Join through DailyPlan to verify ownership
    result = await db.execute(
        select(PlanItem)
        .join(DailyPlan)
        .where(PlanItem.id == item_id, DailyPlan.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan item not found")

    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a plan item.

    Args:
        item_id: The plan item's unique identifier.
        current_user: The authenticated user.
        db: Database session.

    Raises:
        HTTPException: 404 if item not found or doesn't belong to user.
    """
    # Join through DailyPlan to verify ownership
    result = await db.execute(
        select(PlanItem)
        .join(DailyPlan)
        .where(PlanItem.id == item_id, DailyPlan.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan item not found")

    await db.delete(item)
    await db.commit()
