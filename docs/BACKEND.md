# Backend Architecture

The backend is a FastAPI application with async SQLAlchemy for database access and pluggable LLM providers for AI features.

## Technology Stack

- **Python 3.11+**: Runtime
- **FastAPI 0.109+**: Web framework
- **SQLAlchemy 2.0**: Async ORM
- **Alembic 1.13+**: Database migrations
- **Pydantic 2.5+**: Data validation
- **Uvicorn 0.27+**: ASGI server
- **PostgreSQL/SQLite**: Database (asyncpg/aiosqlite drivers)

## Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py        # Authentication endpoints
│   │   │   ├── goals.py       # Goals CRUD
│   │   │   ├── plans.py       # Weekly/daily plans + items
│   │   │   └── agent.py       # AI chat endpoints
│   │   └── deps.py            # FastAPI dependencies
│   │
│   ├── core/
│   │   ├── config.py          # Settings via pydantic-settings
│   │   └── security.py        # JWT + password hashing
│   │
│   ├── db/
│   │   ├── models.py          # SQLAlchemy models
│   │   └── session.py         # Database session management
│   │
│   ├── llm/
│   │   ├── base.py            # LLMProvider abstract base
│   │   ├── claude.py          # Anthropic Claude provider
│   │   ├── openai_provider.py # OpenAI provider
│   │   ├── ollama.py          # Local Ollama provider
│   │   ├── factory.py         # Provider factory
│   │   └── prompts/
│   │       └── system.py      # System prompts
│   │
│   ├── schemas/               # Pydantic models
│   │   ├── auth.py
│   │   ├── goals.py
│   │   ├── plans.py
│   │   └── agent.py
│   │
│   └── main.py                # FastAPI app initialization
│
├── alembic/
│   ├── versions/              # Migration files
│   └── env.py                 # Alembic configuration
│
├── tests/                     # pytest test suite
│   ├── conftest.py            # Test fixtures
│   ├── test_auth.py
│   ├── test_goals.py
│   ├── test_plans.py
│   └── test_agent.py
│
├── alembic.ini
├── requirements.txt
├── pytest.ini
└── .env.example
```

## Database Models

### Entity Relationships

```
User
├── goals (1:N)
├── weekly_plans (1:N)
├── daily_plans (1:N)
└── conversations (1:N)

WeeklyPlan
└── daily_plans (1:N)

DailyPlan
└── items (1:N)

Goal
└── plan_items (1:N, optional link)

AgentConversation
└── messages (1:N)
```

### Model Definitions (`app/db/models.py`)

**User:**
```python
class User(Base):
    __tablename__ = "users"
    id: Mapped[int]                    # Primary key
    email: Mapped[str]                 # Unique, indexed
    password_hash: Mapped[str]         # bcrypt hash
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
```

**Goal:**
```python
class Goal(Base):
    __tablename__ = "goals"
    id: Mapped[int]
    user_id: Mapped[int]               # FK -> users
    title: Mapped[str]
    description: Mapped[Optional[str]]
    time_horizon: Mapped[TimeHorizon]  # short, medium, long
    status: Mapped[GoalStatus]         # active, completed, paused, cancelled
    priority: Mapped[Priority]         # low, medium, high, urgent
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
```

**WeeklyPlan:**
```python
class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"
    id: Mapped[int]
    user_id: Mapped[int]
    week_start_date: Mapped[date]      # Indexed
    summary: Mapped[Optional[str]]
    focus_areas: Mapped[Optional[str]]
    status: Mapped[PlanStatus]         # draft, active, completed
```

**DailyPlan:**
```python
class DailyPlan(Base):
    __tablename__ = "daily_plans"
    id: Mapped[int]
    user_id: Mapped[int]
    date: Mapped[date]                 # Indexed
    weekly_plan_id: Mapped[Optional[int]]  # Optional FK
    summary: Mapped[Optional[str]]
    status: Mapped[PlanStatus]
```

**PlanItem:**
```python
class PlanItem(Base):
    __tablename__ = "plan_items"
    id: Mapped[int]
    daily_plan_id: Mapped[int]         # FK -> daily_plans
    goal_id: Mapped[Optional[int]]     # Optional FK -> goals
    title: Mapped[str]
    notes: Mapped[Optional[str]]
    status: Mapped[ItemStatus]         # todo, in_progress, done, skipped
    priority: Mapped[Priority]
    order: Mapped[int]                 # For sorting
```

**AgentConversation:**
```python
class AgentConversation(Base):
    __tablename__ = "agent_conversations"
    id: Mapped[int]
    user_id: Mapped[int]
    title: Mapped[Optional[str]]
    context_type: Mapped[Optional[str]]   # daily_planning, weekly_planning, etc.
    context_id: Mapped[Optional[int]]     # ID of related entity
```

**AgentMessage:**
```python
class AgentMessage(Base):
    __tablename__ = "agent_messages"
    id: Mapped[int]
    conversation_id: Mapped[int]       # FK -> agent_conversations
    role: Mapped[MessageRole]          # user, assistant, system
    content: Mapped[str]
```

## Database Session Management

`app/db/session.py`:

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine(settings.database_url)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

## Authentication & Security

### JWT Token Flow (`app/core/security.py`)

```python
from jose import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])

def create_access_token(subject: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

### Current User Dependency (`app/api/deps.py`)

```python
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    user_id = int(payload.get("sub"))
    # Fetch and return user from database
```

## LLM Provider Architecture

### Base Provider Interface (`app/llm/base.py`)

```python
from abc import ABC, abstractmethod
from typing import AsyncIterator

class LLMProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> LLMResponse:
        pass

    @abstractmethod
    async def chat_stream(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass
```

### Provider Factory (`app/llm/factory.py`)

```python
def get_llm_provider(provider_name: str | None = None) -> LLMProvider:
    name = provider_name or settings.llm_provider

    if name == "claude":
        return ClaudeProvider()
    elif name == "openai":
        return OpenAIProvider()
    elif name == "ollama":
        return OllamaProvider()
    else:
        raise ValueError(f"Unknown LLM provider: {name}")
```

### Context Building

The agent route builds context from user data before calling LLM:

```python
async def build_context(db, user, context_type, context_id) -> str:
    context_parts = []

    # Always include active goals
    goals = await get_active_goals(db, user.id)
    if goals:
        context_parts.append("User's active goals:")
        for g in goals:
            context_parts.append(f"- [{g.time_horizon}] {g.title}")

    # Add specific context based on type
    if context_type == "daily_planning":
        plan = await get_daily_plan(db, context_id)
        # Add plan details...

    return "\n".join(context_parts)
```

## Alembic Migrations

### Configuration (`alembic.ini`)

```ini
[alembic]
script_location = alembic
sqlalchemy.url = driver://user:pass@localhost/dbname
```

### Common Commands

```bash
# Create a new migration
alembic revision --autogenerate -m "Add new table"

# Apply all migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current
```

### Migration Example (`alembic/versions/...`)

```python
def upgrade():
    op.create_table(
        'goals',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('title', sa.String(500), nullable=False),
        # ...
    )

def downgrade():
    op.drop_table('goals')
```

## Testing

### Test Configuration (`pytest.ini`)

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_functions = test_*
```

### Test Fixtures (`tests/conftest.py`)

```python
@pytest.fixture
async def engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()

@pytest.fixture
async def db_session(engine):
    async with AsyncSessionLocal(bind=engine) as session:
        yield session

@pytest.fixture
async def test_user(db_session):
    user = User(email="test@example.com", password_hash=get_password_hash("password"))
    db_session.add(user)
    await db_session.commit()
    return user

@pytest.fixture
async def authenticated_client(client, auth_token):
    client.headers["Authorization"] = f"Bearer {auth_token}"
    return client
```

### Running Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v --tb=short
```

## Key Dependencies

```
# requirements.txt
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
sqlalchemy[asyncio]>=2.0.0
alembic>=1.13.0
asyncpg>=0.29.0           # PostgreSQL
aiosqlite>=0.19.0         # SQLite for dev
pydantic>=2.5.0
pydantic-settings>=2.1.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
anthropic>=0.18.0         # Claude SDK
openai>=1.10.0            # OpenAI SDK
httpx>=0.26.0             # For Ollama
python-dotenv>=1.0.0

# Testing
pytest>=8.0.0
pytest-asyncio>=0.23.0
pytest-cov>=4.1.0
httpx>=0.26.0             # Test client
```
