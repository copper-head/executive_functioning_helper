"""
Database Session Management and Base Model.

This module configures the async SQLAlchemy engine and session factory
for PostgreSQL database operations. It provides:
- Async engine with connection pooling
- Session factory for creating database sessions
- Dependency injection helper for FastAPI routes
- Base class for all SQLAlchemy ORM models

Usage:
    In FastAPI routes, use the get_db dependency:

        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

# Create async engine with PostgreSQL + asyncpg driver
# echo=True in debug mode logs all SQL statements
engine = create_async_engine(settings.database_url, echo=settings.debug)

# Session factory configured for async operations
# expire_on_commit=False prevents attribute expiration after commit,
# which is important for returning objects from route handlers
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.

    All database models should inherit from this class to be included
    in migrations and to share common functionality.
    """
    pass


async def get_db() -> AsyncSession:
    """
    FastAPI dependency that provides a database session.

    Creates a new session for each request and ensures proper cleanup
    when the request completes. The session is yielded to allow use
    with FastAPI's Depends() injection.

    Yields:
        AsyncSession: An async database session for the current request.

    Example:
        @router.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            # db is automatically managed and closed after the request
            pass
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
