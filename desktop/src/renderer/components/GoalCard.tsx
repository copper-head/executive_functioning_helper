import { Target, Calendar, MoreVertical, CheckCircle2, Clock, Archive } from 'lucide-react';
import { Goal } from '../api/goals';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

function getTimeHorizon(targetDate?: string): 'short' | 'medium' | 'long' | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return 'short';
  if (diffDays <= 30) return 'medium';
  return 'long';
}

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

function getPriorityDisplay(priority: number): { label: string; color: string } {
  if (priority >= 4) return { label: 'High', color: 'text-red-600' };
  if (priority >= 2) return { label: 'Medium', color: 'text-yellow-600' };
  return { label: 'Low', color: 'text-gray-500' };
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const timeHorizon = getTimeHorizon(goal.target_date);
  const horizonColor = getTimeHorizonColor(timeHorizon);
  const priorityInfo = getPriorityDisplay(goal.priority);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEdit(goal)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-gray-400" />
          <h3 className="font-medium text-gray-900 line-clamp-1">{goal.title}</h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(goal.id);
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <MoreVertical size={16} className="text-gray-400" />
        </button>
      </div>

      {goal.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{goal.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${horizonColor}`}>
          {timeHorizon ? `${timeHorizon.charAt(0).toUpperCase() + timeHorizon.slice(1)} term` : 'No deadline'}
        </span>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-50 border border-gray-200">
          {getStatusIcon(goal.status)}
          {getStatusLabel(goal.status)}
        </span>

        <span className={`text-xs font-medium ${priorityInfo.color}`}>
          P{goal.priority}
        </span>
      </div>

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
