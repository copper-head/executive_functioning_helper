"""
Authentication Pydantic Schemas.

This module defines request/response schemas for authentication endpoints.
Schemas validate input data and serialize output data for the auth API.
"""

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """
    Schema for user registration request.

    Attributes:
        email: Valid email address (validated by EmailStr).
        password: Plain text password (will be hashed before storage).
    """
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    """
    Schema for user login request.

    Attributes:
        email: User's registered email address.
        password: Plain text password to verify.
    """
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """
    Schema for user profile response.

    Excludes sensitive fields like password_hash.

    Attributes:
        id: The user's unique identifier.
        email: The user's email address.
    """
    id: int
    email: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    """
    Schema for JWT token response.

    Returned after successful login or signup.

    Attributes:
        access_token: The JWT token string.
        token_type: Token type, always "bearer".
    """
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """
    Schema for decoded token payload.

    Used internally when processing JWT tokens.

    Attributes:
        user_id: The user ID from the token's 'sub' claim.
    """
    user_id: int | None = None
