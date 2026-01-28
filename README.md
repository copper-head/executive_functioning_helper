# Executive Functioning Helper

A desktop app to help with executive functioning: goal setting, daily/weekly planning, and AI-assisted task management.

## Tech Stack

- **Backend**: FastAPI + PostgreSQL + SQLAlchemy
- **Desktop**: Electron + React + Vite + TypeScript
- **AI**: Pluggable LLM providers (Claude, OpenAI, Ollama)

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or SQLite for development)

## Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment template and configure
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Environment Variables

```bash
# .env file
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/exec_func_helper
# Or for SQLite: DATABASE_URL=sqlite+aiosqlite:///./app.db

SECRET_KEY=your-secret-key-here

# LLM Provider (choose one)
LLM_PROVIDER=claude  # or: openai, ollama
ANTHROPIC_API_KEY=your-key  # if using claude
OPENAI_API_KEY=your-key     # if using openai
OLLAMA_HOST=http://localhost:11434  # if using ollama
```

## Desktop Setup

```bash
cd desktop

# Install dependencies
npm install

# Start development server
npm run dev
```

This opens the Electron app with hot-reload. The app expects the backend running at `http://localhost:8000`.

### Build for Production

```bash
npm run build        # Build the app
npm run dist         # Package for distribution
```

## Running Tests

```bash
cd backend
pytest
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/routes/     # API endpoints (auth, goals, plans, agent)
│   │   ├── core/           # Config, security
│   │   ├── db/             # Models, session
│   │   ├── llm/            # LLM providers
│   │   └── schemas/        # Pydantic models
│   ├── alembic/            # Database migrations
│   └── tests/              # pytest tests
│
├── desktop/
│   └── src/
│       ├── main/           # Electron main process
│       └── renderer/       # React app
│           ├── api/        # API client
│           ├── components/ # UI components
│           ├── pages/      # Route pages
│           └── stores/     # Zustand state
```

## Features

- **Authentication**: Email/password with JWT tokens
- **Goals**: Track short/medium/long-term goals with priorities
- **Daily Planning**: Plan your day with tasks linked to goals
- **Weekly Planning**: Set weekly focus areas and review
- **AI Agent**: Chat with AI for planning assistance (supports streaming)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /auth/signup` | Create account |
| `POST /auth/login` | Get JWT token |
| `GET /auth/me` | Current user |
| `GET/POST /goals` | Goals CRUD |
| `GET/POST /plans/weekly` | Weekly plans |
| `GET/POST /plans/daily` | Daily plans |
| `POST /agent/chat` | Chat with AI |
| `POST /agent/chat/stream` | Streaming chat |
