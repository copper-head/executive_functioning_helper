/**
 * @fileoverview Chat Message Input Component
 *
 * Auto-expanding textarea with submit button for sending chat messages.
 * Supports keyboard shortcuts (Enter to send, Shift+Enter for newline).
 *
 * @module components/MessageInput
 */

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

/**
 * Props for the MessageInput component.
 */
interface MessageInputProps {
  /** Callback when a message is submitted */
  onSend: (message: string) => void;
  /** If true, input is disabled (e.g., while sending) */
  disabled?: boolean;
  /** Placeholder text when input is empty */
  placeholder?: string;
}

/**
 * Chat input with auto-expanding textarea.
 *
 * Features:
 * - Auto-expands vertically as user types (up to 200px max height)
 * - Enter key sends message, Shift+Enter adds newline
 * - Clears input after successful send
 * - Disabled state prevents input during message processing
 *
 * @param props - Component props
 * @param props.onSend - Called with trimmed message when submitted
 * @param props.disabled - Whether input should be disabled
 * @param props.placeholder - Placeholder text (default: "Type a message...")
 */
export function MessageInput({ onSend, disabled, placeholder = 'Type a message...' }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get accurate scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set to scrollHeight but cap at 200px max
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  /**
   * Handles form submission - sends message and clears input.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  /**
   * Handles Enter key to submit (Shift+Enter for newline).
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t border-gray-200">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={20} />
      </button>
    </form>
  );
}

export default MessageInput;
