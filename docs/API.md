# API Reference

Base URL: `http://localhost:8000/api`

OpenAPI documentation available at `/docs` when server is running.

## Authentication

All endpoints except `/api/auth/signup` and `/api/auth/login` require authentication via Bearer token.

```
Authorization: Bearer <jwt_token>
```

### POST /api/auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (201):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

**Errors:**
- `400`: Email already registered

### POST /api/auth/login

Authenticate and receive a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

**Errors:**
- `401`: Invalid email or password

### GET /api/auth/me

Get the current authenticated user.

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com"
}
```

**Errors:**
- `401`: Not authenticated

### POST /api/auth/logout

Logout (stateless, client should discard token).

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Goals

### GET /api/goals

List all goals for the authenticated user.

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Learn Python",
    "description": "Master Python programming",
    "time_horizon": "medium",
    "status": "active",
    "priority": "high",
    "created_at": "2026-01-28T12:00:00",
    "updated_at": "2026-01-28T12:00:00"
  }
]
```

### POST /api/goals

Create a new goal.

**Request:**
```json
{
  "title": "Learn Python",
  "description": "Master Python programming",
  "time_horizon": "medium",
  "priority": "high"
}
```

**Enums:**
- `time_horizon`: `"short"`, `"medium"`, `"long"`
- `priority`: `"low"`, `"medium"`, `"high"`, `"urgent"`

**Response (201):** Goal object

### GET /api/goals/{goal_id}

Get a specific goal by ID.

**Response (200):** Goal object

**Errors:**
- `404`: Goal not found

### PATCH /api/goals/{goal_id}

Update a goal.

**Request:**
```json
{
  "title": "Updated title",
  "status": "completed"
}
```

**Enums:**
- `status`: `"active"`, `"completed"`, `"paused"`, `"cancelled"`

**Response (200):** Updated goal object

### DELETE /api/goals/{goal_id}

Delete a goal.

**Response (204):** No content

---

## Plans

### Weekly Plans

#### GET /api/plans/weekly

List all weekly plans.

**Response (200):**
```json
[
  {
    "id": 1,
    "week_start_date": "2026-01-27",
    "summary": "Focus on project completion",
    "focus_areas": "Backend development, testing",
    "status": "active",
    "created_at": "2026-01-27T08:00:00",
    "updated_at": "2026-01-27T08:00:00"
  }
]
```

#### POST /api/plans/weekly

Create a weekly plan.

**Request:**
```json
{
  "week_start_date": "2026-01-27",
  "summary": "Focus on project completion",
  "focus_areas": "Backend development, testing"
}
```

**Response (201):** Weekly plan object

#### GET /api/plans/weekly/{plan_id}

Get a specific weekly plan.

#### PATCH /api/plans/weekly/{plan_id}

Update a weekly plan.

**Request:**
```json
{
  "summary": "Updated summary",
  "status": "completed"
}
```

**Enums:**
- `status`: `"draft"`, `"active"`, `"completed"`

#### DELETE /api/plans/weekly/{plan_id}

Delete a weekly plan.

### Daily Plans

#### GET /api/plans/daily

List daily plans with optional date filtering.

**Query Parameters:**
- `start_date` (optional): Filter plans on or after this date
- `end_date` (optional): Filter plans on or before this date

**Response (200):**
```json
[
  {
    "id": 1,
    "date": "2026-01-28",
    "weekly_plan_id": 1,
    "summary": "Complete API documentation",
    "status": "active",
    "items": [
      {
        "id": 1,
        "title": "Write endpoint docs",
        "notes": null,
        "goal_id": null,
        "status": "todo",
        "priority": "high",
        "order": 0,
        "created_at": "2026-01-28T08:00:00",
        "updated_at": "2026-01-28T08:00:00"
      }
    ],
    "created_at": "2026-01-28T08:00:00",
    "updated_at": "2026-01-28T08:00:00"
  }
]
```

#### POST /api/plans/daily

Create a daily plan.

**Request:**
```json
{
  "date": "2026-01-28",
  "weekly_plan_id": 1,
  "summary": "Complete API documentation"
}
```

#### GET /api/plans/daily/{plan_id}

Get a specific daily plan with items.

#### GET /api/plans/daily/by-date/{date}

Get daily plan for a specific date.

**Path Parameter:**
- `date`: ISO date format (YYYY-MM-DD)

**Errors:**
- `404`: Daily plan not found for this date

#### PATCH /api/plans/daily/{plan_id}

Update a daily plan.

#### DELETE /api/plans/daily/{plan_id}

Delete a daily plan (cascades to items).

### Plan Items

#### POST /api/plans/daily/{plan_id}/items

Add an item to a daily plan.

**Request:**
```json
{
  "title": "Write endpoint docs",
  "notes": "Include request/response examples",
  "goal_id": 1,
  "priority": "high",
  "order": 0
}
```

**Response (201):**
```json
{
  "id": 1,
  "title": "Write endpoint docs",
  "notes": "Include request/response examples",
  "goal_id": 1,
  "status": "todo",
  "priority": "high",
  "order": 0,
  "created_at": "2026-01-28T08:00:00",
  "updated_at": "2026-01-28T08:00:00"
}
```

#### PATCH /api/plans/items/{item_id}

Update a plan item.

**Request:**
```json
{
  "status": "done",
  "notes": "Completed with examples"
}
```

**Enums:**
- `status`: `"todo"`, `"in_progress"`, `"done"`, `"skipped"`

#### DELETE /api/plans/items/{item_id}

Delete a plan item.

---

## Agent (AI Chat)

### GET /api/agent/conversations

List all conversations.

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Help with daily planning",
    "context_type": "daily_planning",
    "created_at": "2026-01-28T10:00:00"
  }
]
```

### POST /api/agent/conversations

Create a new conversation.

**Request:**
```json
{
  "title": "Daily planning help",
  "context_type": "daily_planning",
  "context_id": 1
}
```

**Context Types:**
- `null`: General assistance
- `"daily_planning"`: Daily plan context (context_id = daily_plan_id)
- `"weekly_planning"`: Weekly plan context (context_id = weekly_plan_id)
- `"goal_setting"`: Goal-focused assistance

**Response (201):** Conversation with empty messages array

### GET /api/agent/conversations/{conv_id}

Get a conversation with all messages.

**Response (200):**
```json
{
  "id": 1,
  "title": "Help with daily planning",
  "context_type": "daily_planning",
  "context_id": 1,
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "What should I focus on today?",
      "created_at": "2026-01-28T10:00:00"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "Based on your goals...",
      "created_at": "2026-01-28T10:00:05"
    }
  ],
  "created_at": "2026-01-28T10:00:00"
}
```

### DELETE /api/agent/conversations/{conv_id}

Delete a conversation and all its messages.

### POST /api/agent/chat

Send a message and receive a complete response.

**Request:**
```json
{
  "message": "What should I focus on today?",
  "conversation_id": 1
}
```

If `conversation_id` is null, a new conversation is created.

**Response (200):**
```json
{
  "conversation_id": 1,
  "message": {
    "id": 3,
    "role": "user",
    "content": "What should I focus on today?",
    "created_at": "2026-01-28T10:00:00"
  },
  "response": {
    "id": 4,
    "role": "assistant",
    "content": "Based on your goals and current plan...",
    "created_at": "2026-01-28T10:00:05"
  }
}
```

### POST /api/agent/chat/stream

Send a message and receive a streaming response via Server-Sent Events.

**Request:** Same as `/api/agent/chat`

**Response (200):** `text/event-stream`

```
data: Based on

data: your goals

data: and current plan...

data: [DONE]
```

---

## Error Response Format

All errors return a JSON object:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400`: Bad request (validation error, duplicate data)
- `401`: Unauthorized (invalid or missing token)
- `404`: Resource not found
- `500`: Internal server error

---

## Health Check

### GET /health

Check if the API is running.

**Response (200):**
```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

### GET /

API welcome message.

**Response (200):**
```json
{
  "message": "Executive Functioning Helper API",
  "docs": "/docs"
}
```
