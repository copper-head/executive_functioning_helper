/**
 * @fileoverview Quick Actions Component
 *
 * Grid of shortcut buttons for common actions, displayed on the Dashboard.
 * Provides fast navigation to frequently used features.
 *
 * @module components/QuickActions
 */

import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Target, Calendar } from 'lucide-react';

/**
 * Configuration for a single quick action button.
 */
interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Button label text */
  label: string;
  /** Icon element to display */
  icon: React.ReactNode;
  /** Click handler */
  onClick: () => void;
}

/**
 * Grid of quick action buttons for common tasks.
 *
 * Displays a 2-column grid of buttons that navigate to different
 * sections of the app. Used on the Dashboard for quick access.
 *
 * Current actions:
 * - Add Item: Navigate to daily planning
 * - Chat: Navigate to AI chat
 * - Goals: Navigate to goals page
 * - Daily Plan: Navigate to daily planning
 */
export function QuickActions() {
  const navigate = useNavigate();

  // Define available quick actions
  const actions: QuickAction[] = [
    {
      id: 'add-item',
      label: 'Add Item',
      icon: <Plus size={20} />,
      onClick: () => navigate('/daily'),
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare size={20} />,
      onClick: () => navigate('/chat'),
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: <Target size={20} />,
      onClick: () => navigate('/goals'),
    },
    {
      id: 'plan',
      label: 'Daily Plan',
      icon: <Calendar size={20} />,
      onClick: () => navigate('/daily'),
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h2>

      {/* 2-column action button grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
          >
            <span className="text-gray-500">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
