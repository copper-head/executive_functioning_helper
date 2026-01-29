/**
 * @fileoverview Plan Item Component
 *
 * Displays a single plan item with inline editing, status cycling,
 * notes, and delete functionality. Used in both daily and weekly plans.
 *
 * @module components/PlanItem
 */

import { useState, useRef, useEffect } from 'react';
import { GripVertical, Circle, Clock, CheckCircle2, X, Target, Trash2 } from 'lucide-react';
import type { PlanItem as PlanItemType, ItemStatus } from '../api/plans';

/**
 * Props for the PlanItem component.
 */
interface PlanItemProps {
  /** The plan item data to display */
  item: PlanItemType;
  /** Optional title of the linked goal to display */
  goalTitle?: string;
  /** Callback when status changes */
  onStatusChange: (id: number, status: ItemStatus) => void;
  /** Callback when title changes */
  onTitleChange: (id: number, title: string) => void;
  /** Callback when notes change */
  onNotesChange: (id: number, notes: string) => void;
  /** Callback when item is deleted */
  onDelete: (id: number) => void;
  /** Props for drag handle (for drag-and-drop reordering) */
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

/**
 * Visual configuration for each status type.
 * Defines the icon component and colors for status button.
 */
const statusConfig: Record<ItemStatus, { icon: React.ElementType; color: string; bgColor: string }> = {
  todo: { icon: Circle, color: 'text-gray-400', bgColor: 'hover:bg-gray-100' },
  in_progress: { icon: Clock, color: 'text-blue-500', bgColor: 'hover:bg-blue-50' },
  done: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'hover:bg-green-50' },
  skipped: { icon: X, color: 'text-gray-400', bgColor: 'hover:bg-gray-100' },
};

/**
 * Order for status cycling when user clicks the status button.
 * Cycles through: todo -> in_progress -> done -> todo
 */
const statusOrder: ItemStatus[] = ['todo', 'in_progress', 'done'];

/**
 * Individual plan item with inline editing and status management.
 *
 * Features:
 * - Click status icon to cycle through todo -> in_progress -> done
 * - Click title to edit inline (Enter to save, Escape to cancel)
 * - Expandable notes section
 * - Drag handle for reordering (when drag props provided)
 * - Delete button appears on hover
 * - Visual dimming when item is completed
 *
 * @param props - Component props
 */
export function PlanItem({
  item,
  goalTitle,
  onStatusChange,
  onTitleChange,
  onNotesChange,
  onDelete,
  dragHandleProps,
}: PlanItemProps) {
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [showNotes, setShowNotes] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select title input when entering edit mode
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  /**
   * Cycles status to the next value in the sequence.
   * Wraps around from done back to todo.
   */
  const cycleStatus = () => {
    const currentIndex = statusOrder.indexOf(item.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    onStatusChange(item.id, statusOrder[nextIndex]);
  };

  /**
   * Saves title changes on blur (if changed) or reverts if empty.
   */
  const handleTitleBlur = () => {
    if (editTitle.trim() && editTitle !== item.title) {
      onTitleChange(item.id, editTitle.trim());
    } else {
      setEditTitle(item.title);
    }
    setIsEditing(false);
  };

  /**
   * Handles keyboard shortcuts in title edit mode.
   * Enter: save changes, Escape: cancel editing
   */
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setEditTitle(item.title);
      setIsEditing(false);
    }
  };

  /**
   * Saves notes changes on blur (if changed).
   */
  const handleNotesBlur = () => {
    if (editNotes !== (item.notes || '')) {
      onNotesChange(item.id, editNotes);
    }
  };

  const StatusIcon = statusConfig[item.status].icon;
  const isDone = item.status === 'done';

  return (
    <div
      className={`group flex items-start gap-2 p-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all ${
        isDone ? 'opacity-60' : ''
      }`}
    >
      <div
        {...dragHandleProps}
        className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={16} className="text-gray-400" />
      </div>

      <button
        onClick={cycleStatus}
        className={`mt-0.5 p-1 rounded-full transition-colors ${statusConfig[item.status].bgColor}`}
        title={`Status: ${item.status}`}
      >
        <StatusIcon size={20} className={statusConfig[item.status].color} />
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="w-full px-2 py-1 text-gray-900 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={`cursor-text px-2 py-1 -mx-2 rounded hover:bg-gray-100 ${
              isDone ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {item.title}
          </div>
        )}

        {goalTitle && (
          <div className="flex items-center gap-1 mt-1 text-xs text-purple-600">
            <Target size={12} />
            <span>{goalTitle}</span>
          </div>
        )}

        {(showNotes || item.notes) && (
          <div className="mt-2">
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              className="w-full px-2 py-1 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-300"
              rows={2}
            />
          </div>
        )}

        {!showNotes && !item.notes && (
          <button
            onClick={() => setShowNotes(true)}
            className="mt-1 text-xs text-gray-400 hover:text-gray-600"
          >
            + Add notes
          </button>
        )}
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="mt-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all"
        title="Delete item"
      >
        <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
      </button>
    </div>
  );
}

export default PlanItem;
