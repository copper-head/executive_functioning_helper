import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Target, Calendar } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function QuickActions() {
  const navigate = useNavigate();

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
