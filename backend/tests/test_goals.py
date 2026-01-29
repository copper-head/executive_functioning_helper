import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Goal, TimeHorizon, Priority, GoalStatus


@pytest.fixture
async def test_goal(db_session: AsyncSession, test_user) -> Goal:
    """Create a test goal."""
    goal = Goal(
        user_id=test_user.id,
        title="Test Goal",
        description="A test goal description",
        time_horizon=TimeHorizon.SHORT,
        priority=Priority.MEDIUM,
    )
    db_session.add(goal)
    await db_session.commit()
    await db_session.refresh(goal)
    return goal


class TestListGoals:
    async def test_list_goals_empty(self, authenticated_client: AsyncClient):
        """Test listing goals when none exist."""
        response = await authenticated_client.get("/api/goals")
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_goals_with_data(
        self, authenticated_client: AsyncClient, test_goal
    ):
        """Test listing goals with existing data."""
        response = await authenticated_client.get("/api/goals")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Test Goal"

    async def test_list_goals_unauthenticated(self, client: AsyncClient):
        """Test listing goals without authentication fails."""
        response = await client.get("/api/goals")
        assert response.status_code == 401


class TestCreateGoal:
    async def test_create_goal_success(self, authenticated_client: AsyncClient):
        """Test creating a goal successfully."""
        response = await authenticated_client.post(
            "/api/goals",
            json={
                "title": "New Goal",
                "description": "Goal description",
                "time_horizon": "short",
                "priority": "high",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New Goal"
        assert data["description"] == "Goal description"
        assert data["time_horizon"] == "short"
        assert data["priority"] == "high"
        assert data["status"] == "active"

    async def test_create_goal_minimal(self, authenticated_client: AsyncClient):
        """Test creating a goal with only required fields."""
        response = await authenticated_client.post(
            "/api/goals",
            json={"title": "Minimal Goal"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Minimal Goal"
        assert data["description"] is None
        assert data["time_horizon"] == "short"
        assert data["priority"] == "medium"

    async def test_create_goal_unauthenticated(self, client: AsyncClient):
        """Test creating a goal without authentication fails."""
        response = await client.post(
            "/api/goals",
            json={"title": "Should Fail"},
        )
        assert response.status_code == 401


class TestGetGoal:
    async def test_get_goal_success(
        self, authenticated_client: AsyncClient, test_goal
    ):
        """Test getting a specific goal."""
        response = await authenticated_client.get(f"/api/goals/{test_goal.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_goal.id
        assert data["title"] == "Test Goal"

    async def test_get_goal_not_found(self, authenticated_client: AsyncClient):
        """Test getting a non-existent goal."""
        response = await authenticated_client.get("/api/goals/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Goal not found"

    async def test_get_goal_wrong_user(
        self, client: AsyncClient, db_session: AsyncSession, test_goal
    ):
        """Test that users cannot access other users' goals."""
        # Create another user and authenticate as them
        from app.db.models import User
        from app.core.security import get_password_hash, create_access_token

        other_user = User(
            email="other@example.com",
            password_hash=get_password_hash("password"),
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        token = create_access_token(subject=other_user.id)
        response = await client.get(
            f"/api/goals/{test_goal.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404


class TestUpdateGoal:
    async def test_update_goal_success(
        self, authenticated_client: AsyncClient, test_goal
    ):
        """Test updating a goal."""
        response = await authenticated_client.patch(
            f"/api/goals/{test_goal.id}",
            json={"title": "Updated Title", "status": "completed"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["status"] == "completed"

    async def test_update_goal_partial(
        self, authenticated_client: AsyncClient, test_goal
    ):
        """Test partial update of a goal."""
        response = await authenticated_client.patch(
            f"/api/goals/{test_goal.id}",
            json={"priority": "urgent"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["priority"] == "urgent"
        assert data["title"] == "Test Goal"  # Unchanged

    async def test_update_goal_not_found(self, authenticated_client: AsyncClient):
        """Test updating a non-existent goal."""
        response = await authenticated_client.patch(
            "/api/goals/99999",
            json={"title": "Should Fail"},
        )
        assert response.status_code == 404


class TestDeleteGoal:
    async def test_delete_goal_success(
        self, authenticated_client: AsyncClient, test_goal
    ):
        """Test deleting a goal."""
        response = await authenticated_client.delete(f"/api/goals/{test_goal.id}")
        assert response.status_code == 204

        # Verify deletion
        response = await authenticated_client.get(f"/api/goals/{test_goal.id}")
        assert response.status_code == 404

    async def test_delete_goal_not_found(self, authenticated_client: AsyncClient):
        """Test deleting a non-existent goal."""
        response = await authenticated_client.delete("/api/goals/99999")
        assert response.status_code == 404


class TestGoalEdgeCases:
    """Edge case tests for goal endpoints."""

    async def test_create_goal_all_time_horizons(self, authenticated_client: AsyncClient):
        """Test creating goals with all time horizon values."""
        for horizon in ["short", "medium", "long"]:
            response = await authenticated_client.post(
                "/api/goals",
                json={"title": f"Goal {horizon}", "time_horizon": horizon},
            )
            assert response.status_code == 201
            assert response.json()["time_horizon"] == horizon

    async def test_create_goal_all_priorities(self, authenticated_client: AsyncClient):
        """Test creating goals with all priority values."""
        for priority in ["low", "medium", "high", "urgent"]:
            response = await authenticated_client.post(
                "/api/goals",
                json={"title": f"Goal {priority}", "priority": priority},
            )
            assert response.status_code == 201
            assert response.json()["priority"] == priority

    async def test_update_goal_all_statuses(
        self, authenticated_client: AsyncClient, test_goal
    ):
        """Test updating goal through all status values."""
        for status in ["active", "completed", "paused", "cancelled"]:
            response = await authenticated_client.patch(
                f"/api/goals/{test_goal.id}",
                json={"status": status},
            )
            assert response.status_code == 200
            assert response.json()["status"] == status

    async def test_create_goal_with_long_description(self, authenticated_client: AsyncClient):
        """Test creating a goal with a long description."""
        long_description = "A" * 1000
        response = await authenticated_client.post(
            "/api/goals",
            json={"title": "Long Desc Goal", "description": long_description},
        )
        assert response.status_code == 201
        assert response.json()["description"] == long_description

    async def test_create_goal_missing_title(self, authenticated_client: AsyncClient):
        """Test that missing title is rejected."""
        response = await authenticated_client.post(
            "/api/goals",
            json={},
        )
        assert response.status_code == 422

    async def test_create_goal_invalid_time_horizon(self, authenticated_client: AsyncClient):
        """Test that invalid time horizon is rejected."""
        response = await authenticated_client.post(
            "/api/goals",
            json={"title": "Test", "time_horizon": "invalid"},
        )
        assert response.status_code == 422

    async def test_create_goal_invalid_priority(self, authenticated_client: AsyncClient):
        """Test that invalid priority is rejected."""
        response = await authenticated_client.post(
            "/api/goals",
            json={"title": "Test", "priority": "invalid"},
        )
        assert response.status_code == 422
