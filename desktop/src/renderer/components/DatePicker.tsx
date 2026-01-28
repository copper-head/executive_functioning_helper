import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

function formatDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={goToPreviousDay}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        <div className="flex flex-col items-center min-w-[180px]">
          <span className="text-xl font-semibold text-gray-900">
            {formatDate(selectedDate)}
          </span>
          <span className="text-sm text-gray-500">
            {formatShortDate(selectedDate)}
          </span>
        </div>

        <button
          onClick={goToNextDay}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {!isToday() && (
        <button
          onClick={goToToday}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Calendar size={16} />
          <span>Today</span>
        </button>
      )}
    </div>
  );
}

export default DatePicker;
