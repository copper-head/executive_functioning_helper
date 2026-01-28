import pytest
from datetime import date, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import WeeklyPlan, DailyPlan, PlanItem, PlanStatus, ItemStatus, Priority


@pytest.fixture
async def test_weekly_plan(db_session: AsyncSession, test_user) -> WeeklyPlan:
    """Create a test weekly plan."""
    plan = WeeklyPlan(
        user_id=test_user.id,
        week_start_date=date.today(),
        summary="Test week summary",
        focus_areas="Focus area 1, Focus area 2",
    )
    db_session.add(plan)
    await db_session.commit()
    await db_session.refresh(plan)
    return plan


@pytest.fixture
async def test_daily_plan(
    db_session: AsyncSession, test_user, test_weekly_plan
) -> DailyPlan:
    """Create a test daily plan."""
    plan = DailyPlan(
        user_id=test_user.id,
        date=date.today(),
        weekly_plan_id=test_weekly_plan.id,
        summary="Test day summary",
    )
    db_session.add(plan)
    await db_session.commit()
    await db_session.refresh(plan)
    return plan


@pytest.fixture
async def test_plan_item(db_session: AsyncSession, test_daily_plan) -> PlanItem:
    """Create a test plan item."""
    item = PlanItem(
        daily_plan_id=test_daily_plan.id,
        title="Test task",
        notes="Task notes",
        priority=Priority.HIGH,
        order=1,
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    return item


class TestWeeklyPlans:
    async def test_list_weekly_plans_empty(self, authenticated_client: AsyncClient):
        """Test listing weekly plans when none exist."""
        response = await authenticated_client.get("/api/plans/weekly")
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_weekly_plans(
        self, authenticated_client: AsyncClient, test_weekly_plan
    ):
        """Test listing weekly plans."""
        response = await authenticated_client.get("/api/plans/weekly")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["summary"] == "Test week summary"

    async def test_create_weekly_plan(self, authenticated_client: AsyncClient):
        """Test creating a weekly plan."""
        response = await authenticated_client.post(
            "/api/plans/weekly",
            json={
                "week_start_date": str(date.today()),
                "summary": "New week plan",
                "focus_areas": "Health, Work",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["summary"] == "New week plan"
        assert data["focus_areas"] == "Health, Work"
        assert data["status"] == "draft"

    async def test_get_weekly_plan(
        self, authenticated_client: AsyncClient, test_weekly_plan
    ):
        """Test getting a specific weekly plan."""
        response = await authenticated_client.get(
            f"/api/plans/weekly/{test_weekly_plan.id}"
        )
        assert response.status_code == 200
        assert response.json()["id"] == test_weekly_plan.id

    async def test_get_weekly_plan_not_found(self, authenticated_client: AsyncClient):
        """Test getting non-existent weekly plan."""
        response = await authenticated_client.get("/api/plans/weekly/99999")
        assert response.status_code == 404

    async def test_update_weekly_plan(
        self, authenticated_client: AsyncClient, test_weekly_plan
    ):
        """Test updating a weekly plan."""
        response = await authenticated_client.patch(
            f"/api/plans/weekly/{test_weekly_plan.id}",
            json={"summary": "Updated summary", "status": "active"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["summary"] == "Updated summary"
        assert data["status"] == "active"

    async def test_delete_weekly_plan(
        self, authenticated_client: AsyncClient, test_weekly_plan
    ):
        """Test deleting a weekly plan."""
        response = await authenticated_client.delete(
            f"/api/plans/weekly/{test_weekly_plan.id}"
        )
        assert response.status_code == 204


class TestDailyPlans:
    async def test_list_daily_plans_empty(self, authenticated_client: AsyncClient):
        """Test listing daily plans when none exist."""
        response = await authenticated_client.get("/api/plans/daily")
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_daily_plans(
        self, authenticated_client: AsyncClient, test_daily_plan
    ):
        """Test listing daily plans."""
        response = await authenticated_client.get("/api/plans/daily")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["summary"] == "Test day summary"

    async def test_list_daily_plans_with_date_filter(
        self, authenticated_client: AsyncClient, test_daily_plan
    ):
        """Test listing daily plans with date filter."""
        today = date.today()
        response = await authenticated_client.get(
            f"/api/plans/daily?start_date={today}&end_date={today}"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

        # Filter for a different date
        yesterday = today - timedelta(days=1)
        response = await authenticated_client.get(
            f"/api/plans/daily?start_date={yesterday}&end_date={yesterday}"
        )
        assert response.status_code == 200
        assert response.json() == []

    async def test_create_daily_plan(
        self, authenticated_client: AsyncClient, test_weekly_plan
    ):
        """Test creating a daily plan."""
        response = await authenticated_client.post(
            "/api/plans/daily",
            json={
                "date": str(date.today() + timedelta(days=1)),
                "weekly_plan_id": test_weekly_plan.id,
                "summary": "Tomorrow's plan",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["summary"] == "Tomorrow's plan"
        assert data["weekly_plan_id"] == test_weekly_plan.id
        assert data["items"] == []

    async def test_get_daily_plan(
        self, authenticated_client: AsyncClient, test_daily_plan
    ):
        """Test getting a specific daily plan."""
        response = await authenticated_client.get(
            f"/api/plans/daily/{test_daily_plan.id}"
        )
        assert response.status_code == 200
        assert response.json()["id"] == test_daily_plan.id

    async def test_get_daily_plan_by_date(
        self, authenticated_client: AsyncClient, test_daily_plan
    ):
        """Test getting daily plan by date."""
        response = await authenticated_client.get(
            f"/api/plans/daily/by-date/{date.today()}"
        )
        assert response.status_code == 200
        assert response.json()["id"] == test_daily_plan.id

    async def test_get_daily_plan_by_date_not_found(
        self, authenticated_client: AsyncClient
    ):
        """Test getting daily plan by date when none exists."""
        response = await authenticated_client.get(
            f"/api/plans/daily/by-date/{date.today() - timedelta(days=100)}"
        )
        assert response.status_code == 404

    async def test_update_daily_plan(
        self, authenticated_client: AsyncClient, test_daily_plan
    ):
        """Test updating a daily plan."""
        response = await authenticated_client.patch(
            f"/api/plans/daily/{test_daily_plan.id}",
            json={"summary": "Updated day summary", "status": "completed"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["summary"] == "Updated day summary"
        assert data["status"] == "completed"

    async def test_delete_daily_plan(
        self, authenticated_client: AsyncClient, test_daily_plan
    ):
        """Test deleting a daily plan."""
        response = await authenticated_client.delete(
            f"/api/plans/daily/{test_daily_plan.id}"
        )
        assert response.status_code == 204


class TestPlanItems:
    async def test_create_plan_item(
        self, authenticated_client: AsyncClient, test_daily_plan
    ):
        """Test creating a plan item."""
        response = await authenticated_client.post(
            f"/api/plans/daily/{test_daily_plan.id}/items",
            json={
                "title": "New task",
                "notes": "Task description",
                "priority": "urgent",
                "order": 0,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New task"
        assert data["priority"] == "urgent"
        assert data["status"] == "todo"

    async def test_create_plan_item_minimal(
        self, authenticated_client: AsyncClient, test_daily_plan
    ):
        """Test creating a plan item with minimal data."""
        response = await authenticated_client.post(
            f"/api/plans/daily/{test_daily_plan.id}/items",
            json={"title": "Simple task"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Simple task"
        assert data["priority"] == "medium"

    async def test_create_plan_item_plan_not_found(
        self, authenticated_client: AsyncClient
    ):
        """Test creating item on non-existent plan."""
        response = await authenticated_client.post(
            "/api/plans/daily/99999/items",
            json={"title": "Should fail"},
        )
        assert response.status_code == 404

    async def test_update_plan_item(
        self, authenticated_client: AsyncClient, test_plan_item
    ):
        """Test updating a plan item."""
        response = await authenticated_client.patch(
            f"/api/plans/items/{test_plan_item.id}",
            json={"title": "Updated task", "status": "done"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated task"
        assert data["status"] == "done"

    async def test_update_plan_item_not_found(self, authenticated_client: AsyncClient):
        """Test updating non-existent plan item."""
        response = await authenticated_client.patch(
            "/api/plans/items/99999",
            json={"title": "Should fail"},
        )
        assert response.status_code == 404

    async def test_delete_plan_item(
        self, authenticated_client: AsyncClient, test_plan_item
    ):
        """Test deleting a plan item."""
        response = await authenticated_client.delete(
            f"/api/plans/items/{test_plan_item.id}"
        )
        assert response.status_code == 204

    async def test_delete_plan_item_not_found(self, authenticated_client: AsyncClient):
        """Test deleting non-existent plan item."""
        response = await authenticated_client.delete("/api/plans/items/99999")
        assert response.status_code == 404
