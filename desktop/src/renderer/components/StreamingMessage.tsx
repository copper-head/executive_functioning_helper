/**
 * @fileoverview Streaming Message Component
 *
 * Displays an in-progress AI response with a blinking cursor indicator.
 * Used to show partial content as it streams in from the API.
 *
 * @module components/StreamingMessage
 */

/**
 * Props for the StreamingMessage component.
 */
interface StreamingMessageProps {
  /** The accumulated content received so far from the stream */
  content: string;
}

/**
 * Message bubble for displaying an in-progress streaming response.
 *
 * Similar to assistant message bubble but includes an animated
 * cursor/caret to indicate more content is coming. The cursor
 * pulses to show the response is actively being generated.
 *
 * @param props - Component props
 * @param props.content - Partial response content to display
 */
export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
        <div className="whitespace-pre-wrap">{content}</div>
        {/* Animated cursor indicating response is still streaming */}
        <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
      </div>
    </div>
  );
}

export default StreamingMessage;
