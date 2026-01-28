import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { WeekSelector } from '../components/WeekSelector';
import { FocusAreasEditor } from '../components/FocusAreasEditor';

interface WeeklyPlan {
  week_start_date: string;
  summary: string;
  focus_areas: string[];
  status: 'planning' | 'in_progress' | 'completed' | 'reviewed';
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'reviewed', label: 'Reviewed' },
] as const;

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysOfWeek(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  return days;
}

const STORAGE_KEY = 'exec_func_helper_weekly_plans';

function loadPlans(): Record<string, WeeklyPlan> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function savePlans(plans: Record<string, WeeklyPlan>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function WeeklyPlanning() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [plans, setPlans] = useState<Record<string, WeeklyPlan>>(() => loadPlans());

  const weekKey = formatDateKey(weekStart);
  const currentPlan = plans[weekKey] || {
    week_start_date: weekKey,
    summary: '',
    focus_areas: [],
    status: 'planning' as const,
  };

  const days = getDaysOfWeek(weekStart);

  useEffect(() => {
    savePlans(plans);
  }, [plans]);

  const updatePlan = useCallback((updates: Partial<WeeklyPlan>) => {
    setPlans((prev) => ({
      ...prev,
      [weekKey]: {
        ...currentPlan,
        ...updates,
        week_start_date: weekKey,
      },
    }));
  }, [weekKey, currentPlan]);

  const handlePrevWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setWeekStart(newWeekStart);
  };

  const handleFocusAreasChange = (areas: string[]) => {
    updatePlan({ focus_areas: areas });
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updatePlan({ summary: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePlan({ status: e.target.value as WeeklyPlan['status'] });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Weekly Planning</h1>
        <WeekSelector
          weekStart={weekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
      </header>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Week Overview</h2>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const isToday = formatDateKey(day) === formatDateKey(new Date());
            const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = day.getDate();

            return (
              <Link
                key={day.toISOString()}
                to={`/daily?date=${formatDateKey(day)}`}
                className={`p-3 rounded-lg border text-center transition-colors hover:border-blue-500 ${
                  isToday
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="text-xs text-gray-500 uppercase">{dayName}</div>
                <div
                  className={`text-lg font-medium ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {dayNum}
                </div>
                <Calendar size={14} className="mx-auto mt-1 text-gray-400" />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Focus Areas</h2>
          <FocusAreasEditor
            focusAreas={currentPlan.focus_areas}
            onChange={handleFocusAreasChange}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Status</h2>
          <select
            value={currentPlan.status}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Weekly Summary</h2>
        <textarea
          value={currentPlan.summary}
          onChange={handleSummaryChange}
          placeholder="Write a summary for this week... What are your main goals? What do you want to accomplish?"
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
}

export default WeeklyPlanning;
