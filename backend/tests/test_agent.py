import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AgentConversation, AgentMessage, MessageRole
from app.llm.base import LLMResponse


@pytest.fixture
async def test_conversation(db_session: AsyncSession, test_user) -> AgentConversation:
    """Create a test conversation."""
    conversation = AgentConversation(
        user_id=test_user.id,
        title="Test Conversation",
        context_type="general",
    )
    db_session.add(conversation)
    await db_session.commit()
    await db_session.refresh(conversation)
    return conversation


@pytest.fixture
async def test_conversation_with_messages(
    db_session: AsyncSession, test_conversation
) -> AgentConversation:
    """Create a test conversation with messages."""
    user_msg = AgentMessage(
        conversation_id=test_conversation.id,
        role=MessageRole.USER,
        content="Hello, AI!",
    )
    assistant_msg = AgentMessage(
        conversation_id=test_conversation.id,
        role=MessageRole.ASSISTANT,
        content="Hello! How can I help you today?",
    )
    db_session.add(user_msg)
    db_session.add(assistant_msg)
    await db_session.commit()
    return test_conversation


class TestConversations:
    async def test_list_conversations_empty(self, authenticated_client: AsyncClient):
        """Test listing conversations when none exist."""
        response = await authenticated_client.get("/api/agent/conversations")
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_conversations(
        self, authenticated_client: AsyncClient, test_conversation
    ):
        """Test listing conversations."""
        response = await authenticated_client.get("/api/agent/conversations")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Test Conversation"

    async def test_create_conversation(self, authenticated_client: AsyncClient):
        """Test creating a conversation."""
        response = await authenticated_client.post(
            "/api/agent/conversations",
            json={
                "title": "New Conversation",
                "context_type": "daily_planning",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New Conversation"
        assert data["context_type"] == "daily_planning"
        assert data["messages"] == []

    async def test_get_conversation(
        self, authenticated_client: AsyncClient, test_conversation
    ):
        """Test getting a specific conversation."""
        response = await authenticated_client.get(
            f"/api/agent/conversations/{test_conversation.id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_conversation.id
        assert data["title"] == "Test Conversation"

    async def test_get_conversation_with_messages(
        self, authenticated_client: AsyncClient, test_conversation_with_messages
    ):
        """Test getting conversation with messages."""
        response = await authenticated_client.get(
            f"/api/agent/conversations/{test_conversation_with_messages.id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 2

    async def test_get_conversation_not_found(self, authenticated_client: AsyncClient):
        """Test getting non-existent conversation."""
        response = await authenticated_client.get("/api/agent/conversations/99999")
        assert response.status_code == 404

    async def test_delete_conversation(
        self, authenticated_client: AsyncClient, test_conversation
    ):
        """Test deleting a conversation."""
        response = await authenticated_client.delete(
            f"/api/agent/conversations/{test_conversation.id}"
        )
        assert response.status_code == 204

    async def test_delete_conversation_not_found(
        self, authenticated_client: AsyncClient
    ):
        """Test deleting non-existent conversation."""
        response = await authenticated_client.delete("/api/agent/conversations/99999")
        assert response.status_code == 404


class TestChat:
    async def test_chat_new_conversation(
        self,
        db_session: AsyncSession,
        test_user,
        auth_headers: dict,
    ):
        """Test chat endpoint creating a new conversation."""
        from app.main import app
        from app.db.session import get_db
        from app.llm.factory import get_llm_provider
        from httpx import AsyncClient, ASGITransport

        # Setup mock LLM
        mock_provider = MagicMock()
        mock_provider.chat = AsyncMock(
            return_value=LLMResponse(content="AI response", model="test-model")
        )

        async def override_get_db():
            yield db_session

        def override_get_llm():
            return mock_provider

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_llm_provider] = override_get_llm

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport,
                base_url="http://test",
                headers=auth_headers,
            ) as client:
                response = await client.post(
                    "/api/agent/chat",
                    json={"message": "Hello, AI!"},
                )
                assert response.status_code == 200
                data = response.json()
                assert "conversation_id" in data
                assert data["message"]["content"] == "Hello, AI!"
                assert data["message"]["role"] == "user"
                assert data["response"]["content"] == "AI response"
                assert data["response"]["role"] == "assistant"
        finally:
            app.dependency_overrides.clear()

    async def test_chat_existing_conversation(
        self,
        db_session: AsyncSession,
        test_user,
        test_conversation,
        auth_headers: dict,
    ):
        """Test chat endpoint with existing conversation."""
        from app.main import app
        from app.db.session import get_db
        from app.llm.factory import get_llm_provider
        from httpx import AsyncClient, ASGITransport

        mock_provider = MagicMock()
        mock_provider.chat = AsyncMock(
            return_value=LLMResponse(content="Follow-up response", model="test-model")
        )

        async def override_get_db():
            yield db_session

        def override_get_llm():
            return mock_provider

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_llm_provider] = override_get_llm

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport,
                base_url="http://test",
                headers=auth_headers,
            ) as client:
                response = await client.post(
                    "/api/agent/chat",
                    json={
                        "message": "Follow-up question",
                        "conversation_id": test_conversation.id,
                    },
                )
                assert response.status_code == 200
                data = response.json()
                assert data["conversation_id"] == test_conversation.id
                assert data["response"]["content"] == "Follow-up response"
        finally:
            app.dependency_overrides.clear()

    async def test_chat_conversation_not_found(
        self,
        db_session: AsyncSession,
        test_user,
        auth_headers: dict,
    ):
        """Test chat with non-existent conversation."""
        from app.main import app
        from app.db.session import get_db
        from httpx import AsyncClient, ASGITransport

        async def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport,
                base_url="http://test",
                headers=auth_headers,
            ) as client:
                response = await client.post(
                    "/api/agent/chat",
                    json={
                        "message": "Hello",
                        "conversation_id": 99999,
                    },
                )
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()

    async def test_chat_unauthenticated(self, client: AsyncClient):
        """Test chat endpoint without authentication."""
        response = await client.post(
            "/api/agent/chat",
            json={"message": "Hello"},
        )
        assert response.status_code == 401


class TestChatWithContext:
    """Tests for chat with context building."""

    async def test_chat_with_goals_context(
        self,
        db_session: AsyncSession,
        test_user,
        auth_headers: dict,
    ):
        """Test chat builds context from user goals."""
        from app.main import app
        from app.db.session import get_db
        from app.llm.factory import get_llm_provider
        from app.db.models import Goal, TimeHorizon, Priority
        from httpx import AsyncClient, ASGITransport

        # Create a goal for context
        goal = Goal(
            user_id=test_user.id,
            title="Test Goal",
            description="Goal description",
            time_horizon=TimeHorizon.SHORT,
            priority=Priority.HIGH,
        )
        db_session.add(goal)
        await db_session.commit()

        mock_provider = MagicMock()
        mock_provider.chat = AsyncMock(
            return_value=LLMResponse(content="Response with context", model="test-model")
        )

        async def override_get_db():
            yield db_session

        def override_get_llm():
            return mock_provider

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_llm_provider] = override_get_llm

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport,
                base_url="http://test",
                headers=auth_headers,
            ) as client:
                response = await client.post(
                    "/api/agent/chat",
                    json={"message": "Help me with my goals"},
                )
                assert response.status_code == 200
                # Verify context was included in the LLM call
                mock_provider.chat.assert_called_once()
                call_kwargs = mock_provider.chat.call_args
                assert "system_prompt" in call_kwargs.kwargs
        finally:
            app.dependency_overrides.clear()

    async def test_chat_with_daily_planning_context(
        self,
        db_session: AsyncSession,
        test_user,
        auth_headers: dict,
    ):
        """Test chat with daily planning context."""
        from app.main import app
        from app.db.session import get_db
        from app.llm.factory import get_llm_provider
        from app.db.models import DailyPlan, PlanItem, Priority
        from datetime import date
        from httpx import AsyncClient, ASGITransport

        # Create a daily plan with items
        plan = DailyPlan(
            user_id=test_user.id,
            date=date.today(),
            summary="Today's plan",
        )
        db_session.add(plan)
        await db_session.commit()
        await db_session.refresh(plan)

        item = PlanItem(
            daily_plan_id=plan.id,
            title="Task 1",
            priority=Priority.HIGH,
            order=1,
        )
        db_session.add(item)
        await db_session.commit()

        # Create conversation with context
        conversation = AgentConversation(
            user_id=test_user.id,
            title="Planning chat",
            context_type="daily_planning",
            context_id=plan.id,
        )
        db_session.add(conversation)
        await db_session.commit()
        await db_session.refresh(conversation)

        mock_provider = MagicMock()
        mock_provider.chat = AsyncMock(
            return_value=LLMResponse(content="Planning advice", model="test-model")
        )

        async def override_get_db():
            yield db_session

        def override_get_llm():
            return mock_provider

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_llm_provider] = override_get_llm

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport,
                base_url="http://test",
                headers=auth_headers,
            ) as client:
                response = await client.post(
                    "/api/agent/chat",
                    json={
                        "message": "What should I focus on today?",
                        "conversation_id": conversation.id,
                    },
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

    async def test_chat_with_weekly_planning_context(
        self,
        db_session: AsyncSession,
        test_user,
        auth_headers: dict,
    ):
        """Test chat with weekly planning context."""
        from app.main import app
        from app.db.session import get_db
        from app.llm.factory import get_llm_provider
        from app.db.models import WeeklyPlan
        from datetime import date
        from httpx import AsyncClient, ASGITransport

        # Create a weekly plan
        plan = WeeklyPlan(
            user_id=test_user.id,
            week_start_date=date.today(),
            summary="Weekly goals",
            focus_areas="Health, Work, Learning",
        )
        db_session.add(plan)
        await db_session.commit()
        await db_session.refresh(plan)

        # Create conversation with context
        conversation = AgentConversation(
            user_id=test_user.id,
            title="Weekly review",
            context_type="weekly_planning",
            context_id=plan.id,
        )
        db_session.add(conversation)
        await db_session.commit()
        await db_session.refresh(conversation)

        mock_provider = MagicMock()
        mock_provider.chat = AsyncMock(
            return_value=LLMResponse(content="Weekly planning help", model="test-model")
        )

        async def override_get_db():
            yield db_session

        def override_get_llm():
            return mock_provider

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_llm_provider] = override_get_llm

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport,
                base_url="http://test",
                headers=auth_headers,
            ) as client:
                response = await client.post(
                    "/api/agent/chat",
                    json={
                        "message": "Review my week",
                        "conversation_id": conversation.id,
                    },
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


class TestChatStream:
    """Tests for streaming chat endpoint."""

    async def test_chat_stream_new_conversation(
        self,
        db_session: AsyncSession,
        test_user,
        auth_headers: dict,
    ):
        """Test streaming chat creates new conversation."""
        from app.main import app
        from app.db.session import get_db
        from app.llm.factory import get_llm_provider
        from httpx import AsyncClient, ASGITransport

        async def mock_stream():
            for chunk in ["Hello", " from", " stream"]:
                yield chunk

        mock_provider = MagicMock()
        mock_provider.chat_stream = MagicMock(return_value=mock_stream())

        async def override_get_db():
            yield db_session

        def override_get_llm():
            return mock_provider

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_llm_provider] = override_get_llm

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport,
                base_url="http://test",
                headers=auth_headers,
            ) as client:
                response = await client.post(
                    "/api/agent/chat/stream",
                    json={"message": "Stream test"},
                )
                assert response.status_code == 200
                assert "text/event-stream" in response.headers.get("content-type", "")
        finally:
            app.dependency_overrides.clear()

    async def test_chat_stream_unauthenticated(self, client: AsyncClient):
        """Test streaming chat without authentication."""
        response = await client.post(
            "/api/agent/chat/stream",
            json={"message": "Hello"},
        )
        assert response.status_code == 401


class TestHealthCheck:
    async def test_health_check(self, client: AsyncClient):
        """Test the health check endpoint."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

    async def test_root(self, client: AsyncClient):
        """Test the root endpoint."""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "docs" in data
