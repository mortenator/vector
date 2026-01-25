import React, { useState, useEffect } from "react";
import { Axis, ScaleType } from "../types/vectorChart";

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

export default AxisPanel;
