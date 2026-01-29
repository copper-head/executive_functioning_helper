# Frontend Architecture

The frontend is an Electron desktop application using React 18, TypeScript, and Vite.

## Technology Stack

- **Electron 28**: Desktop shell with context isolation
- **React 18**: UI framework with hooks
- **TypeScript 5.3**: Type-safe JavaScript
- **Vite 5.0**: Fast build tool and dev server
- **React Router 6**: Client-side routing
- **Zustand 4.4**: Lightweight state management
- **TanStack React Query 5**: Server state management
- **Axios 1.6**: HTTP client
- **Tailwind CSS 3.4**: Utility-first styling
- **Lucide React**: Icon library

## Directory Structure

```
desktop/src/
├── main/                   # Electron main process
│   ├── main.ts             # App entry, window creation
│   └── preload.ts          # Context bridge for IPC
│
└── renderer/               # React application
    ├── api/                # API client layer
    │   ├── client.ts       # Axios instance + interceptors
    │   ├── auth.ts         # Auth endpoints
    │   ├── goals.ts        # Goals CRUD
    │   ├── plans.ts        # Plans CRUD
    │   ├── agent.ts        # Chat endpoints
    │   └── queryClient.ts  # React Query config
    │
    ├── components/         # Reusable components
    │   ├── Layout.tsx      # Main layout wrapper
    │   ├── Sidebar.tsx     # Navigation sidebar
    │   ├── ProtectedRoute.tsx
    │   ├── MessageList.tsx
    │   ├── MessageInput.tsx
    │   ├── StreamingMessage.tsx
    │   ├── PlanItem.tsx
    │   ├── GoalCard.tsx
    │   ├── GoalModal.tsx
    │   ├── DatePicker.tsx
    │   ├── TodaySummary.tsx
    │   ├── QuickActions.tsx
    │   ├── FocusAreasEditor.tsx
    │   ├── ConversationList.tsx
    │   └── WeekSelector.tsx
    │
    ├── pages/              # Route pages
    │   ├── Dashboard.tsx   # Home overview
    │   ├── Goals.tsx       # Goal management
    │   ├── DailyPlanning.tsx
    │   ├── WeeklyPlanning.tsx
    │   ├── Chat.tsx        # AI assistant
    │   ├── Login.tsx
    │   └── Signup.tsx
    │
    ├── stores/             # Zustand stores
    │   ├── authStore.ts    # Authentication state
    │   └── chatStore.ts    # Chat/conversation state
    │
    ├── styles/
    │   └── global.css      # Tailwind imports
    │
    ├── App.tsx             # Router configuration
    └── main.tsx            # React entry point
```

## Routing

Routes are defined in `App.tsx`:

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/` | Dashboard | Yes |
| `/goals` | Goals | Yes |
| `/daily` | DailyPlanning | Yes |
| `/weekly` | WeeklyPlanning | Yes |
| `/chat` | Chat | Yes |

Protected routes are wrapped with `ProtectedRoute` which checks `isAuthenticated` from AuthStore.

## Component Hierarchy

```
App
├── Login
├── Signup
└── ProtectedRoute
    └── Layout
        ├── Sidebar
        │   ├── Navigation links
        │   └── User info + Logout
        └── Outlet (page content)
            ├── Dashboard
            │   ├── TodaySummary
            │   ├── QuickActions
            │   └── GoalCard (list)
            ├── Goals
            │   ├── GoalCard (list)
            │   └── GoalModal
            ├── DailyPlanning
            │   ├── DatePicker
            │   └── PlanItem (list)
            ├── WeeklyPlanning
            │   ├── WeekSelector
            │   └── FocusAreasEditor
            └── Chat
                ├── ConversationList
                ├── MessageList
                │   └── StreamingMessage
                └── MessageInput
```

## State Management

### AuthStore (`stores/authStore.ts`)

Manages user authentication state.

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}
```

**Key behaviors:**
- Initializes `token` from localStorage on store creation
- `checkAuth()` is called on app mount to validate existing token
- `login()`/`signup()` store token and fetch user profile
- `logout()` clears token from localStorage and resets state

### ChatStore (`stores/chatStore.ts`)

Manages AI conversation state.

```typescript
interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  fetchConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}
```

**Key behaviors:**
- `sendMessage()` uses streaming endpoint and updates `streamingContent` in real-time
- `isStreaming` flag indicates when response is being received
- Conversation history is persisted on the backend

## API Client Layer

### Axios Instance (`api/client.ts`)

```typescript
export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: adds auth token
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handles 401 by redirecting to login
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

### Token Storage

```typescript
const TOKEN_KEY = 'auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
}
```

## Styling

Tailwind CSS is configured in `tailwind.config.js`:

```javascript
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Global styles in `styles/global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Electron Configuration

### Main Process (`main/main.ts`)

- Creates BrowserWindow with context isolation
- In development: loads Vite dev server URL
- In production: loads built `dist/renderer/index.html`

### Preload Script (`main/preload.ts`)

Provides secure IPC bridge (if needed for native features):

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Add IPC methods here if needed
});
```

### Security Settings

```typescript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,      // Isolates renderer from Node.js
    nodeIntegration: false,      // Prevents direct Node.js access
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

## Development Workflow

```bash
# Install dependencies
npm install

# Run in development (Vite + Electron)
npm run electron:dev

# Build for production
npm run build              # TypeScript + Vite build
npm run electron:build     # Package with electron-builder
```

## Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.469.0"
  },
  "devDependencies": {
    "electron": "^28.1.0",
    "electron-builder": "^24.9.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```
