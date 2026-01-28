import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface FocusAreasEditorProps {
  focusAreas: string[];
  onChange: (areas: string[]) => void;
}

export function FocusAreasEditor({ focusAreas, onChange }: FocusAreasEditorProps) {
  const [newArea, setNewArea] = useState('');

  const handleAddArea = () => {
    const trimmed = newArea.trim();
    if (trimmed && !focusAreas.includes(trimmed)) {
      onChange([...focusAreas, trimmed]);
      setNewArea('');
    }
  };

  const handleRemoveArea = (index: number) => {
    onChange(focusAreas.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddArea();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newArea}
          onChange={(e) => setNewArea(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a focus area..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleAddArea}
          disabled={!newArea.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>
      <ul className="space-y-2">
        {focusAreas.map((area, index) => (
          <li
            key={index}
            className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md group"
          >
            <span className="text-sm text-gray-700">{area}</span>
            <button
              onClick={() => handleRemoveArea(index)}
              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Remove ${area}`}
            >
              <X size={16} />
            </button>
          </li>
        ))}
        {focusAreas.length === 0 && (
          <li className="text-sm text-gray-400 italic py-2">
            No focus areas yet. Add one above.
          </li>
        )}
      </ul>
    </div>
  );
}

export default FocusAreasEditor;
