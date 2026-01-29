# Architecture Overview

Executive Functioning Helper is a full-stack desktop application that helps users with goal setting, daily/weekly planning, and AI-assisted task management.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Electron 28 |
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI + Python 3.11+ |
| Database | PostgreSQL (production) / SQLite (development) |
| ORM | SQLAlchemy 2.0 (async) |
| AI | Pluggable LLM providers (Claude, OpenAI, Ollama) |

## Directory Structure

```
/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/         # API endpoint handlers
│   │   │   │   ├── auth.py     # Authentication endpoints
│   │   │   │   ├── goals.py    # Goals CRUD
│   │   │   │   ├── plans.py    # Weekly/daily plans
│   │   │   │   └── agent.py    # AI chat endpoints
│   │   │   └── deps.py         # FastAPI dependencies
│   │   ├── core/
│   │   │   ├── config.py       # Settings management
│   │   │   └── security.py     # JWT, password hashing
│   │   ├── db/
│   │   │   ├── models.py       # SQLAlchemy models
│   │   │   └── session.py      # Database session management
│   │   ├── llm/
│   │   │   ├── base.py         # LLM provider interface
│   │   │   ├── claude.py       # Anthropic Claude provider
│   │   │   ├── openai_provider.py
│   │   │   ├── ollama.py       # Local LLM support
│   │   │   ├── factory.py      # Provider factory
│   │   │   └── prompts/        # System prompts
│   │   ├── schemas/            # Pydantic validation models
│   │   └── main.py             # FastAPI app initialization
│   ├── alembic/                # Database migrations
│   ├── tests/                  # pytest test suite
│   └── requirements.txt
│
└── desktop/                    # Electron + React frontend
    ├── src/
    │   ├── main/               # Electron main process
    │   │   ├── main.ts         # App entry point
    │   │   └── preload.ts      # Context bridge
    │   └── renderer/           # React application
    │       ├── api/            # API client layer
    │       │   ├── client.ts   # Axios instance
    │       │   ├── auth.ts     # Auth API calls
    │       │   ├── goals.ts    # Goals API calls
    │       │   ├── plans.ts    # Plans API calls
    │       │   └── agent.ts    # Chat API calls
    │       ├── components/     # Reusable UI components
    │       ├── pages/          # Route pages
    │       ├── stores/         # Zustand state stores
    │       │   ├── authStore.ts
    │       │   └── chatStore.ts
    │       ├── styles/         # Global CSS
    │       └── App.tsx         # Router configuration
    ├── package.json
    └── tailwind.config.js
```

## Data Flow

### Authentication Flow

```
┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│   Login     │────>│ POST /api/    │────>│   Validate   │
│   Page      │     │   auth/login  │     │   Password   │
└─────────────┘     └───────────────┘     └──────────────┘
                            │                     │
                            v                     v
┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│  Store in   │<────│  Return JWT   │<────│   Generate   │
│ localStorage│     │    Token      │     │     JWT      │
└─────────────┘     └───────────────┘     └──────────────┘
```

1. User submits credentials via Login page
2. Frontend calls `POST /api/auth/login`
3. Backend validates password against bcrypt hash
4. Backend generates JWT token with user ID
5. Frontend stores token in localStorage
6. Axios interceptor adds `Authorization: Bearer <token>` to all requests

### AI Chat Flow (Streaming)

```
┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│   Chat      │────>│ POST /api/    │────>│   Build      │
│   Input     │     │ agent/chat/   │     │   Context    │
│             │     │ stream        │     │  (goals,     │
└─────────────┘     └───────────────┘     │   plans)     │
                                          └──────────────┘
                                                 │
                                                 v
┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│  Streaming  │<────│    SSE        │<────│   LLM        │
│  Message    │     │  Response     │     │  Provider    │
│  Component  │     │               │     │              │
└─────────────┘     └───────────────┘     └──────────────┘
```

1. User types message in Chat page
2. ChatStore dispatches `sendMessage()`
3. Backend retrieves user's active goals and current plan context
4. System prompt is selected based on context type
5. LLM provider streams response via Server-Sent Events
6. Frontend updates StreamingMessage component in real-time
7. Complete response is saved to database

## State Management

The frontend uses **Zustand** for state management with two primary stores:

### AuthStore
- Manages user authentication state
- Persists JWT token to localStorage
- Validates token on app startup via `/api/auth/me`
- Handles login, signup, and logout flows

### ChatStore
- Manages AI conversation state
- Handles streaming responses
- Maintains conversation history
- Supports conversation CRUD operations

## API Client Architecture

The API client layer uses **Axios** with interceptors:

```typescript
// Request interceptor adds auth token
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handles 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## LLM Provider Architecture

The backend uses a pluggable LLM provider pattern:

```python
class LLMProvider(ABC):
    @abstractmethod
    async def chat(self, messages, system_prompt, ...) -> LLMResponse:
        pass

    @abstractmethod
    async def chat_stream(self, messages, ...) -> AsyncIterator[str]:
        pass
```

Available providers:
- **Claude** (default): Uses Anthropic SDK
- **OpenAI**: Uses OpenAI SDK
- **Ollama**: Local LLM via Ollama server

Provider selection is configured via `LLM_PROVIDER` environment variable.

## Security Model

- **Authentication**: JWT tokens with HS256 signing
- **Password Storage**: bcrypt hashing via passlib
- **Token Expiration**: Configurable (default 7 days)
- **CORS**: Configurable origins for cross-origin requests
- **Electron**: Context isolation enabled, node integration disabled
