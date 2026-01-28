import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { DatePicker } from '../components/DatePicker';
import { PlanItem } from '../components/PlanItem';
import {
  getDailyPlanByDate,
  createDailyPlan,
  addDailyPlanItem,
  updatePlanItem,
  deletePlanItem,
  type DailyPlan,
  type ItemStatus,
} from '../api/plans';
import { getGoals, type Goal } from '../api/goals';

function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function DailyPlanning() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const loadPlan = useCallback(async (date: Date) => {
    setIsLoading(true);
    setError(null);
    const dateStr = formatDateForApi(date);

    try {
      const dailyPlan = await getDailyPlanByDate(dateStr);
      setPlan(dailyPlan);
    } catch (err) {
      if ((err as { response?: { status: number } }).response?.status === 404) {
        try {
          const newPlan = await createDailyPlan(dateStr);
          setPlan(newPlan);
        } catch (createErr) {
          setError('Failed to create daily plan');
          setPlan(null);
        }
      } else {
        setError('Failed to load daily plan');
        setPlan(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGoals = useCallback(async () => {
    try {
      const goalsData = await getGoals();
      setGoals(goalsData);
    } catch {
      // Goals are optional, don't show error
    }
  }, []);

  useEffect(() => {
    loadPlan(selectedDate);
    loadGoals();
  }, [selectedDate, loadPlan, loadGoals]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !plan) return;

    setIsAddingItem(true);
    try {
      const maxOrder = plan.items.reduce((max, item) => Math.max(max, item.order), -1);
      const newItem = await addDailyPlanItem(plan.id.toString(), {
        title: newItemTitle.trim(),
        order: maxOrder + 1,
      });
      setPlan({
        ...plan,
        items: [...plan.items, newItem],
      });
      setNewItemTitle('');
    } catch {
      setError('Failed to add item');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleStatusChange = async (itemId: number, status: ItemStatus) => {
    if (!plan) return;

    const originalItems = plan.items;
    setPlan({
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId ? { ...item, status } : item
      ),
    });

    try {
      await updatePlanItem(itemId.toString(), { status });
    } catch {
      setPlan({ ...plan, items: originalItems });
      setError('Failed to update status');
    }
  };

  const handleTitleChange = async (itemId: number, title: string) => {
    if (!plan) return;

    const originalItems = plan.items;
    setPlan({
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId ? { ...item, title } : item
      ),
    });

    try {
      await updatePlanItem(itemId.toString(), { title });
    } catch {
      setPlan({ ...plan, items: originalItems });
      setError('Failed to update title');
    }
  };

  const handleNotesChange = async (itemId: number, notes: string) => {
    if (!plan) return;

    const originalItems = plan.items;
    setPlan({
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId ? { ...item, notes } : item
      ),
    });

    try {
      await updatePlanItem(itemId.toString(), { notes });
    } catch {
      setPlan({ ...plan, items: originalItems });
      setError('Failed to update notes');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!plan) return;

    const originalItems = plan.items;
    setPlan({
      ...plan,
      items: plan.items.filter((item) => item.id !== itemId),
    });

    try {
      await deletePlanItem(itemId.toString());
    } catch {
      setPlan({ ...plan, items: originalItems });
      setError('Failed to delete item');
    }
  };

  const getGoalTitle = (goalId: number | undefined): string | undefined => {
    if (!goalId) return undefined;
    const goal = goals.find((g) => String(g.id) === String(goalId));
    return goal?.title;
  };

  const sortedItems = plan?.items
    ? [...plan.items].sort((a, b) => a.order - b.order)
    : [];

  const todoItems = sortedItems.filter((item) => item.status === 'todo');
  const inProgressItems = sortedItems.filter((item) => item.status === 'in_progress');
  const doneItems = sortedItems.filter((item) => item.status === 'done');

  const completionRate = sortedItems.length > 0
    ? Math.round((doneItems.length / sortedItems.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Daily Planning</h1>
          <DatePicker selectedDate={selectedDate} onDateChange={handleDateChange} />
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
            <button
              onClick={() => loadPlan(selectedDate)}
              className="ml-2 text-red-700 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {sortedItems.length > 0 && (
              <div className="mb-6 flex items-center gap-4">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  {doneItems.length} of {sortedItems.length} done
                </span>
              </div>
            )}

            <form onSubmit={handleAddItem} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Add a new item..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isAddingItem}
                />
                <button
                  type="submit"
                  disabled={!newItemTitle.trim() || isAddingItem}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Plus size={20} />
                  <span>Add</span>
                </button>
              </div>
            </form>

            <div className="space-y-6">
              {inProgressItems.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
                    In Progress ({inProgressItems.length})
                  </h2>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {inProgressItems.map((item) => (
                      <PlanItem
                        key={item.id}
                        item={item}
                        goalTitle={getGoalTitle(item.goal_id)}
                        onStatusChange={handleStatusChange}
                        onTitleChange={handleTitleChange}
                        onNotesChange={handleNotesChange}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                </section>
              )}

              {todoItems.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    To Do ({todoItems.length})
                  </h2>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {todoItems.map((item) => (
                      <PlanItem
                        key={item.id}
                        item={item}
                        goalTitle={getGoalTitle(item.goal_id)}
                        onStatusChange={handleStatusChange}
                        onTitleChange={handleTitleChange}
                        onNotesChange={handleNotesChange}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                </section>
              )}

              {doneItems.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">
                    Done ({doneItems.length})
                  </h2>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {doneItems.map((item) => (
                      <PlanItem
                        key={item.id}
                        item={item}
                        goalTitle={getGoalTitle(item.goal_id)}
                        onStatusChange={handleStatusChange}
                        onTitleChange={handleTitleChange}
                        onNotesChange={handleNotesChange}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                </section>
              )}

              {sortedItems.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No items for this day</p>
                  <p className="text-sm mt-1">Add your first item above to start planning</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DailyPlanning;
