/**
 * @fileoverview Date Picker Component
 *
 * Navigation component for selecting dates with previous/next day
 * buttons and a "Today" quick jump. Used in daily planning.
 *
 * @module components/DatePicker
 */

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

/**
 * Props for the DatePicker component.
 */
interface DatePickerProps {
  /** Currently selected date */
  selectedDate: Date;
  /** Callback when date changes */
  onDateChange: (date: Date) => void;
}

/**
 * Formats a date for display, using relative terms when appropriate.
 * Returns "Today", "Tomorrow", "Yesterday", or the full date.
 *
 * @param date - The date to format
 * @returns Human-readable date string
 */
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

/**
 * Formats a date in short form (e.g., "Jan 15, 2024").
 *
 * @param date - The date to format
 * @returns Short date string
 */
function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Date navigation component with previous/next day controls.
 *
 * Features:
 * - Shows relative date label (Today, Tomorrow, Yesterday) when applicable
 * - Shows absolute date as secondary label
 * - Previous/next day navigation arrows
 * - "Today" button appears when not viewing today
 *
 * @param props - Component props
 * @param props.selectedDate - The currently selected date
 * @param props.onDateChange - Called when user navigates to a new date
 */
export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  /** Navigate to the previous day */
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  /** Navigate to the next day */
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  /** Jump back to today */
  const goToToday = () => {
    onDateChange(new Date());
  };

  /** Check if selected date is today */
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
        {/* Previous day button */}
        <button
          onClick={goToPreviousDay}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        {/* Date display */}
        <div className="flex flex-col items-center min-w-[180px]">
          <span className="text-xl font-semibold text-gray-900">
            {formatDate(selectedDate)}
          </span>
          <span className="text-sm text-gray-500">
            {formatShortDate(selectedDate)}
          </span>
        </div>

        {/* Next day button */}
        <button
          onClick={goToNextDay}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* "Today" quick jump (hidden when already on today) */}
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
