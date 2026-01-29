/**
 * @fileoverview Goals Page Component
 *
 * Goal management page with CRUD operations, filtering, and
 * grid/list view toggle. Displays goals as cards with progress indicators.
 *
 * @module pages/Goals
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Filter, LayoutGrid, List } from 'lucide-react';
import { Goal, getGoals, createGoal, updateGoal, deleteGoal, CreateGoalRequest, UpdateGoalRequest } from '../api/goals';
import { GoalCard } from '../components/GoalCard';
import { GoalModal } from '../components/GoalModal';

/** Filter options for time horizon */
type TimeHorizon = 'all' | 'short' | 'medium' | 'long';

/** Filter options for goal status */
type StatusFilter = 'all' | 'active' | 'completed' | 'archived';

/** Display mode for goal cards */
type ViewMode = 'grid' | 'list';

/**
 * Determines time horizon based on days until target date.
 * @param targetDate - ISO date string
 * @returns Time horizon category or null if no date
 */
function getTimeHorizon(targetDate?: string): 'short' | 'medium' | 'long' | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return 'short';
  if (diffDays <= 30) return 'medium';
  return 'long';
}

/**
 * Goals management page with full CRUD functionality.
 *
 * Features:
 * - Display goals in grid or list view
 * - Filter by time horizon (short/medium/long term)
 * - Filter by status (active/completed/archived)
 * - Create new goals via modal
 * - Edit existing goals via modal
 * - Delete with confirmation overlay
 * - Empty state with create prompt
 *
 * Route: /goals
 */
export default function Goals() {
  // Data state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [horizonFilter, setHorizonFilter] = useState<TimeHorizon>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();

  // Delete confirmation state (stores goal ID pending deletion)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /**
   * Fetches all goals from the API.
   */
  const fetchGoals = useCallback(async () => {
    try {
      const data = await getGoals();
      setGoals(data);
      setError('');
    } catch (err) {
      setError('Failed to load goals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch goals on mount
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  /**
   * Applies time horizon and status filters to goals list.
   */
  const filteredGoals = goals.filter((goal) => {
    // Filter by status
    if (statusFilter !== 'all' && goal.status !== statusFilter) {
      return false;
    }
    // Filter by time horizon
    if (horizonFilter !== 'all') {
      const horizon = getTimeHorizon(goal.target_date);
      if (horizon !== horizonFilter) {
        return false;
      }
    }
    return true;
  });

  /** Opens modal for creating a new goal */
  const handleCreate = () => {
    setEditingGoal(undefined);
    setIsModalOpen(true);
  };

  /** Opens modal for editing an existing goal */
  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  /** Saves goal (create or update) and refreshes list */
  const handleSave = async (data: CreateGoalRequest | UpdateGoalRequest) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, data);
    } else {
      await createGoal(data as CreateGoalRequest);
    }
    await fetchGoals();
  };

  /**
   * Handles delete with confirmation.
   * First click sets confirmation state, second click performs delete.
   * Confirmation auto-clears after 3 seconds.
   */
  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      // Second click - perform delete
      await deleteGoal(id);
      setDeleteConfirm(null);
      await fetchGoals();
    } else {
      // First click - show confirmation
      setDeleteConfirm(id);
      // Auto-clear confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Goals</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your goals and track progress</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          New Goal
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={horizonFilter}
            onChange={(e) => setHorizonFilter(e.target.value as TimeHorizon)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All timeframes</option>
            <option value="short">Short term ({"<"}1 week)</option>
            <option value="medium">Medium term (1-4 weeks)</option>
            <option value="long">Long term ({">"}1 month)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex-1" />

        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            title="Grid view"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            {goals.length === 0 ? 'No goals yet' : 'No goals match your filters'}
          </div>
          {goals.length === 0 && (
            <button
              onClick={handleCreate}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Create your first goal
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {filteredGoals.map((goal) => (
            <div key={goal.id} className="relative">
              <GoalCard goal={goal} onEdit={handleEdit} onDelete={handleDelete} />
              {deleteConfirm === goal.id && (
                <div className="absolute inset-0 bg-red-50/95 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-red-700 mb-2">Click delete again to confirm</p>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <GoalModal
        goal={editingGoal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(undefined);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
