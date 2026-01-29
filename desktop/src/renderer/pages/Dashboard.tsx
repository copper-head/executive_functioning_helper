/**
 * @fileoverview Dashboard Page Component
 *
 * Home page providing an overview of user's productivity state.
 * Displays greeting, today's plan summary, quick actions,
 * active goals, and recent AI assistant messages.
 *
 * @module pages/Dashboard
 */

import { Target, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { TodaySummary } from '../components/TodaySummary';
import { QuickActions } from '../components/QuickActions';

/**
 * Simplified goal structure for dashboard display.
 */
interface Goal {
  id: string;
  title: string;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Mock data for goals display.
 * TODO: Replace with actual API data.
 */
const mockGoals: Goal[] = [
  { id: '1', title: 'Complete project documentation', progress: 60 },
  { id: '2', title: 'Exercise 3x per week', progress: 33 },
  { id: '3', title: 'Read 2 books this month', progress: 50 },
];

/**
 * Mock data for last conversation display.
 * TODO: Replace with actual API data.
 */
const mockConversation = {
  message: "I've updated your daily plan with the new tasks. Remember to take a break around 3 PM!",
  timestamp: '10:32 AM',
};

/**
 * Returns a time-appropriate greeting based on current hour.
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Formats current date for display header.
 * Example: "Monday, January 15"
 */
function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Card displaying active goals with progress bars.
 */
function GoalsCard({ goals }: { goals: Goal[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target size={16} className="text-gray-500" />
        <h2 className="text-sm font-medium text-gray-900">Active Goals</h2>
      </div>
      <ul className="space-y-4">
        {goals.map((goal) => (
          <li key={goal.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">{goal.title}</span>
              <span className="text-xs text-gray-500">{goal.progress}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Card displaying the most recent AI assistant message.
 */
function ConversationCard({
  message,
  timestamp,
}: {
  message: string;
  timestamp: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={16} className="text-gray-500" />
        <h2 className="text-sm font-medium text-gray-900">Last Agent Message</h2>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-700">{message}</p>
        <p className="text-xs text-gray-400 mt-2">{timestamp}</p>
      </div>
    </div>
  );
}

/**
 * Main dashboard page showing productivity overview.
 *
 * Layout:
 * - Personalized greeting with current date
 * - 2-column responsive grid containing:
 *   - Today's plan summary
 *   - Quick action buttons
 *   - Active goals with progress
 *   - Last AI assistant message
 *
 * Route: /
 */
export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  // Extract display name from email (before @)
  const firstName = user?.email?.split('@')[0] || 'there';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Personalized greeting header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{formatDate()}</p>
      </div>

      {/* Dashboard cards in responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's plan items with completion status */}
        <TodaySummary />

        {/* Shortcut buttons to common actions */}
        <QuickActions />

        {/* Active goals with progress bars */}
        <GoalsCard goals={mockGoals} />

        {/* Most recent AI assistant message */}
        <ConversationCard
          message={mockConversation.message}
          timestamp={mockConversation.timestamp}
        />
      </div>
    </div>
  );
}
