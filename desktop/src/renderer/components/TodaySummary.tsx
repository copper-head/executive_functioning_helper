/**
 * @fileoverview Today's Plan Summary Component
 *
 * Displays a compact overview of today's plan items with completion
 * status. Used on the Dashboard for at-a-glance progress tracking.
 *
 * @module components/TodaySummary
 */

import { CheckCircle2, Circle } from 'lucide-react';

/**
 * Simplified plan item structure for the summary view.
 */
interface PlanItem {
  /** Unique identifier */
  id: string;
  /** Item title */
  title: string;
  /** Whether the item is completed */
  completed: boolean;
  /** Optional scheduled time display */
  time?: string;
}

/**
 * Props for the TodaySummary component.
 */
interface TodaySummaryProps {
  /** Array of plan items to display (defaults to mock data) */
  items?: PlanItem[];
}

/**
 * Mock data for development/preview.
 * TODO: Replace with actual API data in production.
 */
const mockItems: PlanItem[] = [
  { id: '1', title: 'Morning planning session', completed: true, time: '9:00 AM' },
  { id: '2', title: 'Review weekly goals', completed: true, time: '9:30 AM' },
  { id: '3', title: 'Deep work block', completed: false, time: '10:00 AM' },
  { id: '4', title: 'Check emails and messages', completed: false, time: '12:00 PM' },
  { id: '5', title: 'Afternoon planning', completed: false, time: '2:00 PM' },
];

/**
 * Compact summary of today's planned items with progress indicator.
 *
 * Features:
 * - Shows up to 5 items
 * - Completion counter (X/Y done)
 * - Visual completion state (checkmark vs circle)
 * - Optional time display for each item
 * - Strikethrough styling for completed items
 *
 * @param props - Component props
 * @param props.items - Plan items to display (uses mock data if not provided)
 */
export function TodaySummary({ items = mockItems }: TodaySummaryProps) {
  const completedCount = items.filter((item) => item.completed).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      {/* Header with title and progress counter */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-900">Today's Plan</h2>
        <span className="text-xs text-gray-500">
          {completedCount}/{items.length} done
        </span>
      </div>

      {/* Item list (limited to 5 items) */}
      <ul className="space-y-3">
        {items.slice(0, 5).map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            {/* Status icon */}
            {item.completed ? (
              <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Circle size={18} className="text-gray-300 mt-0.5 flex-shrink-0" />
            )}

            {/* Item content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  item.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                }`}
              >
                {item.title}
              </p>
              {item.time && (
                <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodaySummary;
