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


# Weekly Plans
@router.get("/weekly", response_model=list[WeeklyPlanResponse])
async def list_weekly_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
    result = await db.execute(
        select(WeeklyPlan).where(WeeklyPlan.id == plan_id, WeeklyPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly plan not found")

    await db.delete(plan)
    await db.commit()


# Daily Plans
@router.get("/daily", response_model=list[DailyPlanResponse])
async def list_daily_plans(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(DailyPlan)
        .where(DailyPlan.user_id == current_user.id)
        .options(selectinload(DailyPlan.items))
        .order_by(DailyPlan.date.desc())
    )

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
    plan = DailyPlan(
        user_id=current_user.id,
        date=plan_in.date,
        weekly_plan_id=plan_in.weekly_plan_id,
        summary=plan_in.summary,
    )
    db.add(plan)
    await db.commit()

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
    result = await db.execute(
        select(DailyPlan)
        .where(DailyPlan.date == plan_date, DailyPlan.user_id == current_user.id)
        .options(selectinload(DailyPlan.items))
    )
    plan = result.scalar_one_or_none()

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
    await db.refresh(plan)
    return plan


@router.delete("/daily/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_daily_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DailyPlan).where(DailyPlan.id == plan_id, DailyPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily plan not found")

    await db.delete(plan)
    await db.commit()


# Plan Items
@router.post("/daily/{plan_id}/items", response_model=PlanItemResponse, status_code=status.HTTP_201_CREATED)
async def create_plan_item(
    plan_id: int,
    item_in: PlanItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
