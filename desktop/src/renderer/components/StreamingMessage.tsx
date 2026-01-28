interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
        <div className="whitespace-pre-wrap">{content}</div>
        <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
      </div>
    </div>
  );
}

export default StreamingMessage;
