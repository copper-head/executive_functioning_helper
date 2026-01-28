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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])
app.include_router(plans.router, prefix="/api/plans", tags=["plans"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}


@app.get("/")
async def root():
    return {"message": "Executive Functioning Helper API", "docs": "/docs"}
