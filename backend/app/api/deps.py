"""
FastAPI Dependency Injection Helpers.

This module provides reusable dependencies for route handlers,
primarily authentication-related dependencies that extract and
validate the current user from JWT tokens.

Usage:
    @router.get("/protected")
    async def protected_route(current_user: User = Depends(get_current_user)):
        # current_user is guaranteed to be a valid, authenticated user
        return {"user_id": current_user.id}
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import User
from app.core.security import verify_token

# HTTP Bearer token extractor - looks for "Authorization: Bearer <token>" header
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency that extracts and validates the current authenticated user.

    Parses the JWT token from the Authorization header, verifies it,
    and loads the corresponding user from the database. Raises 401
    Unauthorized if the token is invalid or the user doesn't exist.

    Args:
        credentials: Bearer token credentials extracted by FastAPI.
        db: Database session from dependency injection.

    Returns:
        User: The authenticated user model instance.

    Raises:
        HTTPException: 401 if token is invalid/expired or user not found.
    """
    token = credentials.credentials
    user_id = verify_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
