/**
 * @fileoverview Goal Create/Edit Modal Component
 *
 * Modal dialog for creating new goals or editing existing ones.
 * Handles form state, validation, and submission with loading states.
 *
 * @module components/GoalModal
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Goal, CreateGoalRequest, UpdateGoalRequest } from '../api/goals';

/**
 * Props for the GoalModal component.
 */
interface GoalModalProps {
  /** Existing goal to edit (undefined for creating new goal) */
  goal?: Goal;
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback to save the goal (create or update) */
  onSave: (data: CreateGoalRequest | UpdateGoalRequest) => Promise<void>;
}

/**
 * Modal dialog for goal creation and editing.
 *
 * Features:
 * - Adapts UI for create vs edit mode
 * - Form validation (title required)
 * - Loading state during save
 * - Error display
 * - Resets form state when goal changes
 * - Status field only shown in edit mode
 *
 * @param props - Component props
 * @param props.goal - Goal to edit, or undefined for new goal
 * @param props.isOpen - Controls modal visibility
 * @param props.onClose - Called when modal should close
 * @param props.onSave - Called with form data on submit
 */
export function GoalModal({ goal, isOpen, onClose, onSave }: GoalModalProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<Goal['status']>('active');
  const [priority, setPriority] = useState(3);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Determine mode: editing existing goal vs creating new
  const isEditing = !!goal;

  // Reset form when goal changes or modal opens
  useEffect(() => {
    if (goal) {
      // Populate form with existing goal data
      setTitle(goal.title);
      setDescription(goal.description || '');
      // Extract date portion from ISO string for date input
      setTargetDate(goal.target_date ? goal.target_date.split('T')[0] : '');
      setStatus(goal.status);
      setPriority(goal.priority);
    } else {
      // Reset to defaults for new goal
      setTitle('');
      setDescription('');
      setTargetDate('');
      setStatus('active');
      setPriority(3);
    }
    setError('');
  }, [goal, isOpen]);

  /**
   * Handles form submission with validation.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build request payload, conditionally including status for edits
      const data: CreateGoalRequest | UpdateGoalRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        target_date: targetDate || undefined,
        priority,
        ...(isEditing && { status }),
      };
      await onSave(data);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save goal');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Goal' : 'New Goal'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What do you want to achieve?"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Add more details..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1-5)
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value={1}>1 (Lowest)</option>
                <option value={2}>2</option>
                <option value={3}>3 (Medium)</option>
                <option value={4}>4</option>
                <option value={5}>5 (Highest)</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Goal['status'])}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GoalModal;
