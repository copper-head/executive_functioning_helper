import pytest
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.db.models import User
from app.core.security import get_password_hash, create_access_token
from app.llm.factory import get_llm_provider
from app.llm.base import LLMResponse

# Use SQLite in-memory database for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session() as session:
        yield session


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database session override."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        password_hash=get_password_hash("testpassword123"),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def auth_token(test_user: User) -> str:
    """Create an authentication token for the test user."""
    return create_access_token(subject=test_user.id)


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    """Create authorization headers with the test user's token."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
async def authenticated_client(
    db_session: AsyncSession,
    test_user: User,
    auth_headers: dict,
) -> AsyncGenerator[AsyncClient, None]:
    """Create an authenticated test client."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers=auth_headers,
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def mock_llm_provider():
    """Create a mock LLM provider for agent tests."""
    mock_provider = MagicMock()
    mock_provider.chat = AsyncMock(
        return_value=LLMResponse(content="Test response from AI", model="test-model")
    )

    async def mock_stream():
        for chunk in ["Test ", "streaming ", "response"]:
            yield chunk

    mock_provider.chat_stream = MagicMock(return_value=mock_stream())
    return mock_provider


@pytest.fixture
async def client_with_mock_llm(
    db_session: AsyncSession,
    mock_llm_provider,
) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with mocked LLM provider."""
    async def override_get_db():
        yield db_session

    def override_get_llm():
        return mock_llm_provider

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_llm_provider] = override_get_llm

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
