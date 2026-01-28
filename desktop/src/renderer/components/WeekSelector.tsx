import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekSelectorProps {
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekStart.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

export function WeekSelector({ weekStart, onPrevWeek, onNextWeek }: WeekSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onPrevWeek}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Previous week"
      >
        <ChevronLeft size={20} className="text-gray-600" />
      </button>
      <span className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
        {formatWeekRange(weekStart)}
      </span>
      <button
        onClick={onNextWeek}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Next week"
      >
        <ChevronRight size={20} className="text-gray-600" />
      </button>
    </div>
  );
}

export default WeekSelector;
