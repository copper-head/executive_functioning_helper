import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient

from app.core.security import create_access_token, verify_token, verify_password, get_password_hash


class TestSecurityFunctions:
    """Tests for security helper functions."""

    def test_password_hash_and_verify(self):
        """Test password hashing and verification."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)

    def test_create_and_verify_token(self):
        """Test token creation and verification."""
        user_id = "123"
        token = create_access_token(subject=user_id)
        verified_id = verify_token(token)
        assert verified_id == user_id

    def test_token_with_custom_expiry(self):
        """Test token with custom expiration time."""
        user_id = "456"
        token = create_access_token(subject=user_id, expires_delta=timedelta(hours=1))
        verified_id = verify_token(token)
        assert verified_id == user_id

    def test_invalid_token_returns_none(self):
        """Test that invalid tokens return None."""
        result = verify_token("invalid.token.here")
        assert result is None

    def test_expired_token_returns_none(self):
        """Test that expired tokens return None."""
        user_id = "789"
        # Create token that expired in the past
        token = create_access_token(subject=user_id, expires_delta=timedelta(seconds=-1))
        result = verify_token(token)
        assert result is None


class TestTokenAuthentication:
    """Tests for token-based authentication edge cases."""

    async def test_token_for_deleted_user(self, client: AsyncClient, db_session):
        """Test that token for non-existent user fails."""
        # Create a valid token for a user ID that doesn't exist
        token = create_access_token(subject="99999")
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "User not found"

    async def test_malformed_bearer_token(self, client: AsyncClient):
        """Test that malformed bearer token fails."""
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer"},
        )
        assert response.status_code in [401, 422]

    async def test_missing_bearer_prefix(self, client: AsyncClient):
        """Test that missing Bearer prefix fails."""
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "some-token"},
        )
        assert response.status_code in [401, 403]


class TestSignup:
    async def test_signup_success(self, client: AsyncClient):
        """Test successful user registration."""
        response = await client.post(
            "/api/auth/signup",
            json={"email": "newuser@example.com", "password": "securepassword123"},
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_signup_duplicate_email(self, client: AsyncClient, test_user):
        """Test registration with existing email fails."""
        response = await client.post(
            "/api/auth/signup",
            json={"email": "test@example.com", "password": "anotherpassword"},
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Email already registered"

    async def test_signup_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email format fails."""
        response = await client.post(
            "/api/auth/signup",
            json={"email": "notanemail", "password": "password123"},
        )
        assert response.status_code == 422


class TestLogin:
    async def test_login_success(self, client: AsyncClient, test_user):
        """Test successful login."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "testpassword123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        """Test login with wrong password fails."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent email fails."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "noone@example.com", "password": "password123"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"


class TestGetMe:
    async def test_get_me_authenticated(self, authenticated_client: AsyncClient):
        """Test getting current user when authenticated."""
        response = await authenticated_client.get("/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert "id" in data

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        """Test getting current user without authentication fails."""
        response = await client.get("/api/auth/me")
        assert response.status_code == 401

    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token fails."""
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert response.status_code == 401


class TestLogout:
    async def test_logout(self, authenticated_client: AsyncClient):
        """Test logout endpoint."""
        response = await authenticated_client.post("/api/auth/logout")
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"
