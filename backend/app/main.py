"""
Executive Functioning Helper API - Main Application Entry Point.

This module initializes the FastAPI application and configures all middleware,
routers, and basic endpoints. The application serves as an AI-driven assistant
to help users with executive functioning tasks like goal setting, daily/weekly
planning, and staying oriented through conversational AI support.

Architecture Overview:
    - /api/auth: User authentication (signup, login, JWT tokens)
    - /api/goals: CRUD operations for user goals
    - /api/plans: Weekly and daily planning with plan items
    - /api/agent: AI chat interface for executive functioning assistance
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routes import auth, goals, plans, agent

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="AI-driven executive functioning assistant API",
    version="0.1.0",
)

# Configure CORS middleware to allow cross-origin requests from frontend clients.
# This is essential for the desktop/web app to communicate with the API.
# Credentials are enabled to support JWT token authentication in cookies/headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers with their respective prefixes and OpenAPI tags
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])
app.include_router(plans.router, prefix="/api/plans", tags=["plans"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and load balancer probes.

    Returns:
        dict: Status and version information for the API.
    """
    return {"status": "healthy", "version": "0.1.0"}


@app.get("/")
async def root():
    """
    Root endpoint providing API information and documentation link.

    Returns:
        dict: Welcome message and path to interactive API documentation.
    """
    return {"message": "Executive Functioning Helper API", "docs": "/docs"}
