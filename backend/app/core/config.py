"""
Application Configuration Management.

This module provides centralized configuration using Pydantic Settings.
All configuration values can be overridden via environment variables or
a .env file. The settings are cached using lru_cache for performance.

Environment Variables:
    APP_NAME: Display name for the application
    DEBUG: Enable debug mode (verbose logging, SQL echo)
    DATABASE_URL: Async PostgreSQL connection string
    DATABASE_URL_SYNC: Sync PostgreSQL connection string (for Alembic)
    SECRET_KEY: JWT signing key (MUST be changed in production)
    ALGORITHM: JWT algorithm (default: HS256)
    ACCESS_TOKEN_EXPIRE_MINUTES: Token lifetime in minutes
    LLM_PROVIDER: AI provider selection (claude, openai, ollama)
    ANTHROPIC_API_KEY: API key for Claude
    OPENAI_API_KEY: API key for OpenAI
    OLLAMA_BASE_URL: URL for local Ollama instance
    OLLAMA_MODEL: Model name for Ollama
    CORS_ORIGINS: Allowed origins for CORS (comma-separated in env)
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    """
    Application settings with environment variable support.

    All settings have sensible defaults for local development but should
    be configured via environment variables in production, especially
    security-sensitive values like SECRET_KEY and API keys.
    """

    # App settings
    app_name: str = "Executive Functioning Helper"
    debug: bool = False

    # Database - uses asyncpg driver for async SQLAlchemy operations
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/exec_func_helper"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/exec_func_helper"

    # Auth - JWT configuration
    # WARNING: secret_key MUST be changed in production to a secure random value
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # LLM Provider - supports multiple AI backends for flexibility
    llm_provider: Literal["claude", "openai", "ollama"] = "claude"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama2"

    # CORS - origins that are allowed to make cross-origin requests
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """
    Get cached application settings.

    Uses lru_cache to ensure settings are only loaded once from
    environment/files, improving performance and ensuring consistency
    across the application.

    Returns:
        Settings: The application configuration instance.
    """
    return Settings()
