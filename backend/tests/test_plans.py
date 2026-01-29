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


class TestDateBoundaryConditions:
    """Tests for date boundary conditions in plans."""

    async def test_create_daily_plan_future_date(
        self, authenticated_client: AsyncClient, test_weekly_plan
    ):
        """Test creating a daily plan for a future date."""
        future_date = date.today() + timedelta(days=30)
        response = await authenticated_client.post(
            "/api/plans/daily",
            json={
                "date": str(future_date),
                "weekly_plan_id": test_weekly_plan.id,
                "summary": "Future plan",
            },
        )
        assert response.status_code == 201
        assert response.json()["date"] == str(future_date)

    async def test_create_daily_plan_past_date(
        self, authenticated_client: AsyncClient, test_weekly_plan
    ):
        """Test creating a daily plan for a past date."""
        past_date = date.today() - timedelta(days=30)
        response = await authenticated_client.post(
            "/api/plans/daily",
            json={
                "date": str(past_date),
                "weekly_plan_id": test_weekly_plan.id,
                "summary": "Past plan",
            },
        )
        assert response.status_code == 201
        assert response.json()["date"] == str(past_date)

    async def test_list_daily_plans_date_range(
        self, authenticated_client: AsyncClient, db_session: AsyncSession, test_user, test_weekly_plan
    ):
        """Test listing daily plans with date range filter."""
        # Create plans for multiple dates
        today = date.today()
        for i in range(5):
            plan_date = today + timedelta(days=i)
            plan = DailyPlan(
                user_id=test_user.id,
                date=plan_date,
                weekly_plan_id=test_weekly_plan.id,
                summary=f"Plan for day {i}",
            )
            db_session.add(plan)
        await db_session.commit()

        # Query for a subset
        start = today + timedelta(days=1)
        end = today + timedelta(days=3)
        response = await authenticated_client.get(
            f"/api/plans/daily?start_date={start}&end_date={end}"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    async def test_weekly_plan_date_validation(self, authenticated_client: AsyncClient):
        """Test creating weekly plans with various date formats."""
        # Valid date
        response = await authenticated_client.post(
            "/api/plans/weekly",
            json={
                "week_start_date": "2026-06-15",
                "summary": "Mid-year plan",
            },
        )
        assert response.status_code == 201

    async def test_create_multiple_plans_same_date(
        self, authenticated_client: AsyncClient, test_weekly_plan
    ):
        """Test that multiple daily plans can exist for different purposes."""
        target_date = date.today() + timedelta(days=50)

        # Create first plan
        response1 = await authenticated_client.post(
            "/api/plans/daily",
            json={
                "date": str(target_date),
                "weekly_plan_id": test_weekly_plan.id,
                "summary": "First plan",
            },
        )
        assert response1.status_code == 201

        # Create second plan for same date
        response2 = await authenticated_client.post(
            "/api/plans/daily",
            json={
                "date": str(target_date),
                "weekly_plan_id": test_weekly_plan.id,
                "summary": "Second plan",
            },
        )
        assert response2.status_code == 201


class TestPlanStatusTransitions:
    """Tests for plan status transitions."""

    async def test_weekly_plan_status_transitions(
        self, authenticated_client: AsyncClient, test_weekly_plan
    ):
        """Test all valid status transitions for weekly plans."""
        statuses = ["draft", "active", "completed"]
        for status in statuses:
            response = await authenticated_client.patch(
                f"/api/plans/weekly/{test_weekly_plan.id}",
                json={"status": status},
            )
            assert response.status_code == 200
            assert response.json()["status"] == status

    async def test_daily_plan_status_transitions(
        self, authenticated_client: AsyncClient, test_daily_plan
    ):
        """Test all valid status transitions for daily plans."""
        statuses = ["draft", "active", "completed"]
        for status in statuses:
            response = await authenticated_client.patch(
                f"/api/plans/daily/{test_daily_plan.id}",
                json={"status": status},
            )
            assert response.status_code == 200
            assert response.json()["status"] == status

    async def test_plan_item_status_transitions(
        self, authenticated_client: AsyncClient, test_plan_item
    ):
        """Test all valid status transitions for plan items."""
        statuses = ["todo", "in_progress", "done", "skipped"]
        for status in statuses:
            response = await authenticated_client.patch(
                f"/api/plans/items/{test_plan_item.id}",
                json={"status": status},
            )
            assert response.status_code == 200
            assert response.json()["status"] == status


class TestPlanEdgeCases:
    """Edge case tests for plan endpoints."""

    async def test_create_daily_plan_without_weekly(
        self, authenticated_client: AsyncClient
    ):
        """Test creating a daily plan without a weekly plan reference."""
        response = await authenticated_client.post(
            "/api/plans/daily",
            json={
                "date": str(date.today() + timedelta(days=100)),
                "summary": "Standalone daily plan",
            },
        )
        assert response.status_code == 201
        assert response.json()["weekly_plan_id"] is None

    async def test_create_plan_item_all_priorities(
        self, authenticated_client: AsyncClient, test_daily_plan
    ):
        """Test creating plan items with all priority values."""
        for priority in ["low", "medium", "high", "urgent"]:
            response = await authenticated_client.post(
                f"/api/plans/daily/{test_daily_plan.id}/items",
                json={"title": f"Task {priority}", "priority": priority},
            )
            assert response.status_code == 201
            assert response.json()["priority"] == priority

    async def test_update_plan_item_reorder(
        self, authenticated_client: AsyncClient, test_plan_item
    ):
        """Test reordering a plan item."""
        response = await authenticated_client.patch(
            f"/api/plans/items/{test_plan_item.id}",
            json={"order": 10},
        )
        assert response.status_code == 200
        assert response.json()["order"] == 10

    async def test_weekly_plan_with_long_focus_areas(
        self, authenticated_client: AsyncClient
    ):
        """Test creating weekly plan with long focus areas text."""
        long_focus = ", ".join([f"Focus area {i}" for i in range(50)])
        response = await authenticated_client.post(
            "/api/plans/weekly",
            json={
                "week_start_date": str(date.today()),
                "summary": "Test",
                "focus_areas": long_focus,
            },
        )
        assert response.status_code == 201
        assert response.json()["focus_areas"] == long_focus


class TestPlanNotFoundErrors:
    """Tests for not found error handling in plan endpoints."""

    async def test_get_daily_plan_not_found(self, authenticated_client: AsyncClient):
        """Test getting non-existent daily plan."""
        response = await authenticated_client.get("/api/plans/daily/99999")
        assert response.status_code == 404

    async def test_update_daily_plan_not_found(self, authenticated_client: AsyncClient):
        """Test updating non-existent daily plan."""
        response = await authenticated_client.patch(
            "/api/plans/daily/99999",
            json={"summary": "Should fail"},
        )
        assert response.status_code == 404

    async def test_delete_daily_plan_not_found(self, authenticated_client: AsyncClient):
        """Test deleting non-existent daily plan."""
        response = await authenticated_client.delete("/api/plans/daily/99999")
        assert response.status_code == 404

    async def test_update_weekly_plan_not_found(self, authenticated_client: AsyncClient):
        """Test updating non-existent weekly plan."""
        response = await authenticated_client.patch(
            "/api/plans/weekly/99999",
            json={"summary": "Should fail"},
        )
        assert response.status_code == 404

    async def test_delete_weekly_plan_not_found(self, authenticated_client: AsyncClient):
        """Test deleting non-existent weekly plan."""
        response = await authenticated_client.delete("/api/plans/weekly/99999")
        assert response.status_code == 404
