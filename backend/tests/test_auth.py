import pytest
from httpx import AsyncClient


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
        assert response.status_code == 403

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
