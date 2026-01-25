import React, { useState, useEffect } from "react";
import { Axis, AxisBreak, ScaleType } from "../types/vectorChart";
import { createAxisBreak } from "../rendering/axes";

interface AxisPanelProps {
  axis: Axis;
  label: string;
  onChange: (axis: Axis) => void;
}

const AxisPanel: React.FC<AxisPanelProps> = ({ axis, label, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localAxis, setLocalAxis] = useState<Axis>(axis);

  useEffect(() => {
    setLocalAxis(axis);
  }, [axis]);

  const handleChange = (updates: Partial<Axis>) => {
    const updated = { ...localAxis, ...updates };
    setLocalAxis(updated);
    onChange(updated);
  };

  const handleMinChange = (value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    handleChange({ minValue: isNaN(numValue as number) ? null : numValue });
  };

  const handleMaxChange = (value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    handleChange({ maxValue: isNaN(numValue as number) ? null : numValue });
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 space-y-3 bg-white">
          {/* Scale Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Scale Type
            </label>
            <select
              value={localAxis.scaleType}
              onChange={(e) =>
                handleChange({ scaleType: e.target.value as ScaleType })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="linear">Linear</option>
              <option value="log">Logarithmic</option>
            </select>
          </div>

          {/* Min/Max Values */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Min Value
              </label>
              <input
                type="number"
                value={localAxis.minValue ?? ""}
                onChange={(e) => handleMinChange(e.target.value)}
                placeholder="Auto"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max Value
              </label>
              <input
                type="number"
                value={localAxis.maxValue ?? ""}
                onChange={(e) => handleMaxChange(e.target.value)}
                placeholder="Auto"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Reverse Axis */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`reverse-${axis.id}`}
              checked={localAxis.isReversed}
              onChange={(e) => handleChange({ isReversed: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor={`reverse-${axis.id}`}
              className="text-xs text-gray-600"
            >
              Reverse axis direction
            </label>
          </div>

          {/* Axis Breaks */}
          {axis.orientation === "y" && (
            <AxisBreakEditor
              breaks={localAxis.breaks || []}
              onChange={(breaks) => handleChange({ breaks })}
            />
          )}

          {/* Reset Button */}
          <button
            onClick={() =>
              handleChange({
                minValue: null,
                maxValue: null,
                isReversed: false,
                scaleType: "linear",
              })
            }
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Reset to auto
          </button>
        </div>
      )}
    </div>
  );
};

interface AxisConfigurationProps {
  axes: Axis[];
  onChange: (axes: Axis[]) => void;
}

export const AxisConfiguration: React.FC<AxisConfigurationProps> = ({
  axes,
  onChange,
}) => {
  const yAxis = axes.find((a) => a.orientation === "y");
  const xAxis = axes.find((a) => a.orientation === "x");

  const handleAxisChange = (updatedAxis: Axis) => {
    const newAxes = axes.map((a) =>
      a.id === updatedAxis.id ? updatedAxis : a
    );
    onChange(newAxes);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Axis Configuration</h3>
      {yAxis && (
        <AxisPanel
          axis={yAxis}
          label="Value Axis (Y)"
          onChange={handleAxisChange}
        />
      )}
      {xAxis && (
        <AxisPanel
          axis={xAxis}
          label="Category Axis (X)"
          onChange={handleAxisChange}
        />
      )}
      {!yAxis && !xAxis && (
        <p className="text-xs text-gray-500 italic">
          No axes configured for this chart type.
        </p>
      )}
    </div>
  );
};

// ============================================================================
// Axis Break Editor
// ============================================================================

interface AxisBreakEditorProps {
  breaks: AxisBreak[];
  onChange: (breaks: AxisBreak[]) => void;
}

const AxisBreakEditor: React.FC<AxisBreakEditorProps> = ({
  breaks,
  onChange,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");
  const [style, setStyle] = useState<"wiggle" | "straight">("wiggle");

  const handleAddBreak = () => {
    const start = parseFloat(startValue);
    const end = parseFloat(endValue);
    if (isNaN(start) || isNaN(end) || start >= end) return;

    const newBreak = createAxisBreak(start, end, style);
    onChange([...breaks, newBreak]);
    setStartValue("");
    setEndValue("");
    setShowAddForm(false);
  };

  const handleRemoveBreak = (id: string) => {
    onChange(breaks.filter((b) => b.id !== id));
  };

  return (
    <div className="border-t pt-3 mt-3">
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Axis Breaks
      </label>

      {/* Existing breaks */}
      {breaks.length > 0 && (
        <div className="space-y-1 mb-2">
          {breaks.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
            >
              <span>
                {b.startValue} → {b.endValue} ({b.style})
              </span>
              <button
                onClick={() => handleRemoveBreak(b.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add break form */}
      {showAddForm ? (
        <div className="space-y-2 p-2 bg-blue-50 rounded">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="number"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                placeholder="Start"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="number"
                value={endValue}
                onChange={(e) => setEndValue(e.target.value)}
                placeholder="End"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as "wiggle" | "straight")}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            >
              <option value="wiggle">Zigzag</option>
              <option value="straight">Straight</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddBreak}
              className="flex-1 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Break
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-1.5 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
        >
          + Add Axis Break
        </button>
      )}

      {breaks.length === 0 && !showAddForm && (
        <p className="text-xs text-gray-400 italic mt-1">
          Breaks hide a range of values to focus on relevant data.
        </p>
      )}
    </div>
  );
};

export default AxisPanel;
