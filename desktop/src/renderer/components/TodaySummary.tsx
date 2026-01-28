import { CheckCircle2, Circle } from 'lucide-react';

interface PlanItem {
  id: string;
  title: string;
  completed: boolean;
  time?: string;
}

interface TodaySummaryProps {
  items?: PlanItem[];
}

const mockItems: PlanItem[] = [
  { id: '1', title: 'Morning planning session', completed: true, time: '9:00 AM' },
  { id: '2', title: 'Review weekly goals', completed: true, time: '9:30 AM' },
  { id: '3', title: 'Deep work block', completed: false, time: '10:00 AM' },
  { id: '4', title: 'Check emails and messages', completed: false, time: '12:00 PM' },
  { id: '5', title: 'Afternoon planning', completed: false, time: '2:00 PM' },
];

export function TodaySummary({ items = mockItems }: TodaySummaryProps) {
  const completedCount = items.filter((item) => item.completed).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-900">Today's Plan</h2>
        <span className="text-xs text-gray-500">
          {completedCount}/{items.length} done
        </span>
      </div>
      <ul className="space-y-3">
        {items.slice(0, 5).map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            {item.completed ? (
              <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Circle size={18} className="text-gray-300 mt-0.5 flex-shrink-0" />
            )}
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
