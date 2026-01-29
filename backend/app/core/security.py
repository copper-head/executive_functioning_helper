"""
Security Utilities for Authentication and Authorization.

This module provides core security functions for the application:
- JWT token creation and verification for stateless authentication
- Password hashing and verification using bcrypt

Security Notes:
    - Passwords are hashed using bcrypt with automatic salt generation
    - JWT tokens contain user ID in the 'sub' claim and expiration in 'exp'
    - Token verification returns None on any failure (expired, invalid, tampered)
    - The secret key should be a cryptographically secure random value in production
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

# Password hashing context using bcrypt algorithm
# The "deprecated=auto" setting allows seamless migration if we change algorithms
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token for user authentication.

    Args:
        subject: The token subject, typically the user ID. Will be converted to string.
        expires_delta: Optional custom expiration time. If None, uses config default.

    Returns:
        str: Encoded JWT token string.

    Example:
        token = create_access_token(subject=user.id)
        token = create_access_token(subject=user.id, expires_delta=timedelta(hours=1))
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token(token: str) -> str | None:
    """
    Verify a JWT token and extract the user ID.

    Validates the token signature and expiration. Returns None for any
    verification failure to prevent information leakage about why
    authentication failed.

    Args:
        token: The JWT token string to verify.

    Returns:
        str | None: The user ID from the token's 'sub' claim, or None if invalid.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        # Catch all JWT errors (expired, invalid signature, malformed, etc.)
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.

    Uses bcrypt's built-in timing-safe comparison to prevent timing attacks.

    Args:
        plain_password: The plain text password from user input.
        hashed_password: The stored bcrypt hash to compare against.

    Returns:
        bool: True if the password matches, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.

    Automatically generates a random salt and uses the bcrypt cost factor
    from the CryptContext configuration.

    Args:
        password: The plain text password to hash.

    Returns:
        str: The bcrypt hash string (includes algorithm identifier and salt).
    """
    return pwd_context.hash(password)
