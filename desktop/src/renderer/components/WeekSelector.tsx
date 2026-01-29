/**
 * @fileoverview Week Selector Component
 *
 * Navigation component for selecting weeks with previous/next week
 * buttons. Used in weekly planning.
 *
 * @module components/WeekSelector
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Props for the WeekSelector component.
 */
interface WeekSelectorProps {
  /** The start date of the currently selected week */
  weekStart: Date;
  /** Callback to navigate to previous week */
  onPrevWeek: () => void;
  /** Callback to navigate to next week */
  onNextWeek: () => void;
}

/**
 * Formats a week range for display.
 * Handles cross-month ranges appropriately.
 *
 * @param weekStart - The start date of the week
 * @returns Formatted string like "Jan 15 - 21, 2024" or "Jan 29 - Feb 4, 2024"
 */
function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekStart.getFullYear();

  // Omit duplicate month if week is within same month
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

/**
 * Week navigation component with previous/next controls.
 *
 * Displays the current week's date range with arrow buttons
 * to navigate between weeks.
 *
 * @param props - Component props
 * @param props.weekStart - Start date of selected week
 * @param props.onPrevWeek - Called when user clicks previous arrow
 * @param props.onNextWeek - Called when user clicks next arrow
 */
export function WeekSelector({ weekStart, onPrevWeek, onNextWeek }: WeekSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Previous week button */}
      <button
        onClick={onPrevWeek}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Previous week"
      >
        <ChevronLeft size={20} className="text-gray-600" />
      </button>

      {/* Week range display */}
      <span className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
        {formatWeekRange(weekStart)}
      </span>

      {/* Next week button */}
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
