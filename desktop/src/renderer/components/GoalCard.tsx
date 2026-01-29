/**
 * @fileoverview Goal Card Component
 *
 * Displays a single goal in a card format with status, priority,
 * time horizon indicators, and action buttons. Used in the Goals page grid.
 *
 * @module components/GoalCard
 */

import { Target, Calendar, MoreVertical, CheckCircle2, Clock, Archive } from 'lucide-react';
import { Goal } from '../api/goals';

/**
 * Props for the GoalCard component.
 */
interface GoalCardProps {
  /** The goal data to display */
  goal: Goal;
  /** Callback when clicking the card to edit the goal */
  onEdit: (goal: Goal) => void;
  /** Callback when clicking delete (via menu) */
  onDelete: (id: string) => void;
}

/**
 * Determines the time horizon based on days until target date.
 * - Short: 7 days or less (urgent)
 * - Medium: 8-30 days
 * - Long: More than 30 days
 *
 * @param targetDate - ISO date string of the goal's target date
 * @returns Time horizon classification or null if no date
 */
function getTimeHorizon(targetDate?: string): 'short' | 'medium' | 'long' | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return 'short';
  if (diffDays <= 30) return 'medium';
  return 'long';
}

/**
 * Returns Tailwind CSS classes for time horizon badge coloring.
 * Red for short-term (urgent), yellow for medium, green for long-term.
 */
function getTimeHorizonColor(horizon: 'short' | 'medium' | 'long' | null): string {
  switch (horizon) {
    case 'short':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'long':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Returns the appropriate status icon component for a goal status.
 */
function getStatusIcon(status: Goal['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={16} className="text-green-600" />;
    case 'archived':
      return <Archive size={16} className="text-gray-400" />;
    default:
      return <Clock size={16} className="text-blue-600" />;
  }
}

/**
 * Returns human-readable label for a goal status.
 */
function getStatusLabel(status: Goal['status']): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'completed':
      return 'Completed';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}

/**
 * Returns display properties for a priority level.
 * Higher numbers (4-5) are high priority, 2-3 medium, 1 low.
 */
function getPriorityDisplay(priority: number): { label: string; color: string } {
  if (priority >= 4) return { label: 'High', color: 'text-red-600' };
  if (priority >= 2) return { label: 'Medium', color: 'text-yellow-600' };
  return { label: 'Low', color: 'text-gray-500' };
}

/**
 * Displays a single goal as an interactive card.
 *
 * Features:
 * - Click anywhere on card to edit the goal
 * - Time horizon badge (color-coded by urgency)
 * - Status badge with icon
 * - Priority indicator
 * - Optional due date display
 * - Description preview (truncated to 2 lines)
 *
 * @param props - Component props
 * @param props.goal - The goal data to display
 * @param props.onEdit - Called when card is clicked for editing
 * @param props.onDelete - Called when delete action is triggered
 */
export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const timeHorizon = getTimeHorizon(goal.target_date);
  const horizonColor = getTimeHorizonColor(timeHorizon);
  const priorityInfo = getPriorityDisplay(goal.priority);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEdit(goal)}
    >
      {/* Header: Title and menu button */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-gray-400" />
          <h3 className="font-medium text-gray-900 line-clamp-1">{goal.title}</h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click handler
            onDelete(goal.id);
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <MoreVertical size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Description (if present) - limited to 2 lines */}
      {goal.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{goal.description}</p>
      )}

      {/* Metadata badges: time horizon, status, priority */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Time horizon badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${horizonColor}`}>
          {timeHorizon ? `${timeHorizon.charAt(0).toUpperCase() + timeHorizon.slice(1)} term` : 'No deadline'}
        </span>

        {/* Status badge with icon */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-50 border border-gray-200">
          {getStatusIcon(goal.status)}
          {getStatusLabel(goal.status)}
        </span>

        {/* Priority indicator */}
        <span className={`text-xs font-medium ${priorityInfo.color}`}>
          P{goal.priority}
        </span>
      </div>

      {/* Due date (if present) */}
      {goal.target_date && (
        <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
          <Calendar size={12} />
          <span>Due {new Date(goal.target_date).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}

export default GoalCard;
