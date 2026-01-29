"""
Authentication API Routes.

This module provides endpoints for user authentication:
- POST /signup: Create a new user account
- POST /login: Authenticate and receive a JWT token
- GET /me: Get the current user's profile
- POST /logout: Logout (client-side token disposal)

Security Notes:
    - Passwords are hashed with bcrypt before storage
    - JWT tokens are used for stateless authentication
    - Login returns a generic error message to prevent user enumeration
    - Logout is a no-op on the server (JWT is stateless)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account.

    Creates a new user with the provided email and password, then
    immediately returns a JWT token for authentication.

    Args:
        user_in: User registration data (email, password).
        db: Database session.

    Returns:
        Token: JWT access token for the new user.

    Raises:
        HTTPException: 400 if email is already registered.
    """
    # Check for existing user with same email
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user with hashed password
    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Return token immediately so user is logged in after signup
    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Authenticate a user and return a JWT token.

    Validates the email and password combination. Returns a generic
    error message on failure to prevent user enumeration attacks.

    Args:
        user_in: Login credentials (email, password).
        db: Database session.

    Returns:
        Token: JWT access token for the authenticated user.

    Raises:
        HTTPException: 401 if credentials are invalid.
    """
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()

    # Generic error prevents attackers from determining if email exists
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.

    Args:
        current_user: The authenticated user (injected by dependency).

    Returns:
        UserResponse: The user's profile information.
    """
    return current_user


@router.post("/logout")
async def logout():
    """
    Logout the current user.

    Since JWT tokens are stateless, logout is handled client-side
    by discarding the token. This endpoint exists for API completeness
    and could be extended to implement token blacklisting if needed.

    Returns:
        dict: Confirmation message.
    """
    return {"message": "Logged out successfully"}
