import { Target, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { TodaySummary } from '../components/TodaySummary';
import { QuickActions } from '../components/QuickActions';

interface Goal {
  id: string;
  title: string;
  progress: number;
}

const mockGoals: Goal[] = [
  { id: '1', title: 'Complete project documentation', progress: 60 },
  { id: '2', title: 'Exercise 3x per week', progress: 33 },
  { id: '3', title: 'Read 2 books this month', progress: 50 },
];

const mockConversation = {
  message: "I've updated your daily plan with the new tasks. Remember to take a break around 3 PM!",
  timestamp: '10:32 AM',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

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

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.email?.split('@')[0] || 'there';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{formatDate()}</p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Summary */}
        <TodaySummary />

        {/* Quick Actions */}
        <QuickActions />

        {/* Active Goals */}
        <GoalsCard goals={mockGoals} />

        {/* Last Conversation */}
        <ConversationCard
          message={mockConversation.message}
          timestamp={mockConversation.timestamp}
        />
      </div>
    </div>
  );
}
