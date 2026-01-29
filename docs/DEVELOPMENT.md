# Development Guide

This guide covers local setup, environment configuration, running tests, and common development tasks.

## Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 18+** (for desktop app)
- **PostgreSQL** (optional, SQLite works for development)

## Backend Setup

### 1. Create Virtual Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Database URL
# SQLite for development:
DATABASE_URL=sqlite:///./app.db

# PostgreSQL for production:
# DATABASE_URL=postgresql://user:password@localhost:5432/exec_func_helper

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080  # 7 days

# Application settings
APP_ENV=development
DEBUG=true

# CORS - comma-separated allowed origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# LLM Provider (claude, openai, or ollama)
LLM_PROVIDER=claude

# API Keys (configure the one for your chosen provider)
ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama2
```

### 4. Run Database Migrations

```bash
alembic upgrade head
```

### 5. Start the Server

```bash
# Development with auto-reload
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: `http://localhost:8000`
- OpenAPI docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Frontend Setup

### 1. Install Dependencies

```bash
cd desktop
npm install
```

### 2. Run Development Server

```bash
# Run Electron app with Vite hot-reload
npm run electron:dev
```

This starts both:
- Vite dev server for React (with HMR)
- Electron main process

### 3. Build for Production

```bash
# Build React app
npm run build

# Package Electron app
npm run electron:build
```

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | Database connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT signing |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `JWT_EXPIRE_MINUTES` | No | `30` | Token expiration in minutes |
| `CORS_ORIGINS` | No | `*` | Comma-separated allowed origins |
| `LLM_PROVIDER` | No | `claude` | LLM provider (claude/openai/ollama) |
| `ANTHROPIC_API_KEY` | If claude | - | Anthropic API key |
| `OPENAI_API_KEY` | If openai | - | OpenAI API key |
| `OLLAMA_BASE_URL` | If ollama | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | If ollama | `llama2` | Ollama model name |

### Frontend

The frontend reads the backend URL from the API client configuration. Modify `desktop/src/renderer/api/client.ts` if needed:

```typescript
export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
});
```

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_auth.py

# Run specific test
pytest tests/test_auth.py::TestLogin::test_login_success

# Run with coverage report
pytest --cov=app --cov-report=html
# View report at htmlcov/index.html

# Run with short traceback
pytest --tb=short
```

### Test Structure

```
tests/
├── conftest.py       # Shared fixtures
├── test_auth.py      # Authentication tests
├── test_goals.py     # Goals CRUD tests
├── test_plans.py     # Plans CRUD tests
└── test_agent.py     # AI chat tests
```

### Key Test Fixtures

- `engine`: In-memory SQLite database
- `db_session`: Async database session
- `client`: AsyncClient for API testing
- `test_user`: Pre-created test user
- `auth_token`: Valid JWT token for test user
- `authenticated_client`: Client with auth headers
- `mock_llm_provider`: Mocked LLM for agent tests

## Common Development Tasks

### Create a New Database Migration

```bash
cd backend

# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Apply migration
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# View current revision
alembic current

# View migration history
alembic history
```

### Add a New API Endpoint

1. Create/update route handler in `app/api/routes/`
2. Add Pydantic schemas in `app/schemas/`
3. Register router in `app/main.py` if new file
4. Add tests in `tests/`

Example route:

```python
# app/api/routes/myfeature.py
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/items")
async def list_items(current_user: User = Depends(get_current_user)):
    return []
```

Register in `main.py`:

```python
from app.api.routes import myfeature
app.include_router(myfeature.router, prefix="/api/myfeature", tags=["myfeature"])
```

### Add a New Database Model

1. Define model in `app/db/models.py`
2. Create migration: `alembic revision --autogenerate -m "Add model"`
3. Apply migration: `alembic upgrade head`
4. Add Pydantic schemas
5. Add CRUD routes
6. Add tests

### Add a New Frontend Page

1. Create page component in `desktop/src/renderer/pages/`
2. Add route in `App.tsx`
3. Add navigation link in `Sidebar.tsx`
4. Add any needed API functions in `api/`
5. Add state management if needed in `stores/`

### Configure a Different LLM Provider

**Claude (default):**
```bash
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

**OpenAI:**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

**Ollama (local):**
```bash
# First, install and start Ollama
# https://ollama.ai

LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

## Troubleshooting

### Backend won't start

1. Check Python version: `python --version` (need 3.11+)
2. Verify virtual environment is activated
3. Check `.env` file exists and has required variables
4. Ensure database is accessible

### Frontend won't connect to backend

1. Verify backend is running: `curl http://localhost:8000/health`
2. Check CORS settings in backend `.env`
3. Verify API URL in `client.ts`

### Database migration fails

1. Check DATABASE_URL is correct
2. Try dropping and recreating the database
3. Run `alembic stamp head` to reset migration state

### LLM not responding

1. Verify API key is set correctly
2. Check LLM_PROVIDER matches your API key
3. For Ollama, ensure server is running: `ollama serve`

### Tests fail with bcrypt error

Install bcrypt backend:
```bash
pip install bcrypt
```

Or on some systems:
```bash
pip install passlib[bcrypt]
```
