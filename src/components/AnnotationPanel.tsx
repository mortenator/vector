import React, { useState } from "react";
import {
  SimpleAnnotation,
  createValueLineAnnotation,
  createDiffArrowAnnotation,
} from "../rendering/annotations";
import { ChartData } from "../types/chartData";

interface AnnotationPanelProps {
  chartData: ChartData;
  annotations: SimpleAnnotation[];
  onChange: (annotations: SimpleAnnotation[]) => void;
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  chartData,
  annotations,
  onChange,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Value line form state
  const [valueLineValue, setValueLineValue] = useState("");
  const [valueLineLabel, setValueLineLabel] = useState("");

  // Diff arrow form state
  const [diffFromSeries, setDiffFromSeries] = useState(0);
  const [diffFromCategory, setDiffFromCategory] = useState(0);
  const [diffToSeries, setDiffToSeries] = useState(0);
  const [diffToCategory, setDiffToCategory] = useState(
    Math.max(0, chartData.categories.length - 1)
  );

  const handleAddValueLine = () => {
    const value = parseFloat(valueLineValue);
    if (isNaN(value)) return;

    const annotation = createValueLineAnnotation(
      value,
      valueLineLabel || undefined
    );
    onChange([...annotations, annotation]);
    setValueLineValue("");
    setValueLineLabel("");
    setShowAddMenu(false);
  };

  const handleAddDiffArrow = () => {
    const annotation = createDiffArrowAnnotation(
      diffFromSeries,
      diffFromCategory,
      diffToSeries,
      diffToCategory
    );
    onChange([...annotations, annotation]);
    setShowAddMenu(false);
  };

  const handleToggleAnnotation = (id: string) => {
    onChange(
      annotations.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      )
    );
  };

  const handleRemoveAnnotation = (id: string) => {
    onChange(annotations.filter((a) => a.id !== id));
  };

  const getAnnotationLabel = (annotation: SimpleAnnotation): string => {
    switch (annotation.type) {
      case "valueLine":
        return `Value Line: ${annotation.config.valueLine?.label || annotation.config.valueLine?.value}`;
      case "diffArrow":
        const diff = annotation.config.diffArrow;
        if (!diff) return "Diff Arrow";
        return `Diff: ${chartData.categories[diff.fromCategoryIndex]} → ${chartData.categories[diff.toCategoryIndex]}`;
      case "cagr":
        return "CAGR Arrow";
      default:
        return "Annotation";
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing annotations */}
      {annotations.length > 0 && (
        <div className="space-y-2">
          {annotations.map((annotation) => (
            <div
              key={annotation.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleAnnotation(annotation.id)}
                  className={`w-4 h-4 rounded border ${
                    annotation.enabled
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {annotation.enabled && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <span className="text-xs text-gray-700">
                  {getAnnotationLabel(annotation)}
                </span>
              </div>
              <button
                onClick={() => handleRemoveAnnotation(annotation.id)}
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

      {/* Add annotation button */}
      {!showAddMenu ? (
        <button
          onClick={() => setShowAddMenu(true)}
          className="w-full py-2 px-3 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Annotation
        </button>
      ) : (
        <div className="border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Add Annotation
            </span>
            <button
              onClick={() => setShowAddMenu(false)}
              className="text-gray-400 hover:text-gray-600"
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

          {/* Value Line Section */}
          <div className="border-t pt-3">
            <h4 className="text-xs font-medium text-gray-600 mb-2">
              Value Line (Reference Line)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={valueLineValue}
                onChange={(e) => setValueLineValue(e.target.value)}
                placeholder="Value"
                className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={valueLineLabel}
                onChange={(e) => setValueLineLabel(e.target.value)}
                placeholder="Label (optional)"
                className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAddValueLine}
              disabled={!valueLineValue}
              className="mt-2 w-full py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Value Line
            </button>
          </div>

          {/* Difference Arrow Section */}
          <div className="border-t pt-3">
            <h4 className="text-xs font-medium text-gray-600 mb-2">
              Difference Arrow
            </h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    From Category
                  </label>
                  <select
                    value={diffFromCategory}
                    onChange={(e) =>
                      setDiffFromCategory(parseInt(e.target.value, 10))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {chartData.categories.map((cat, i) => (
                      <option key={i} value={i}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    To Category
                  </label>
                  <select
                    value={diffToCategory}
                    onChange={(e) =>
                      setDiffToCategory(parseInt(e.target.value, 10))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {chartData.categories.map((cat, i) => (
                      <option key={i} value={i}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {chartData.series.length > 1 && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      From Series
                    </label>
                    <select
                      value={diffFromSeries}
                      onChange={(e) =>
                        setDiffFromSeries(parseInt(e.target.value, 10))
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {chartData.series.map((s, i) => (
                        <option key={i} value={i}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      To Series
                    </label>
                    <select
                      value={diffToSeries}
                      onChange={(e) =>
                        setDiffToSeries(parseInt(e.target.value, 10))
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {chartData.series.map((s, i) => (
                        <option key={i} value={i}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <button
                onClick={handleAddDiffArrow}
                className="w-full py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Add Difference Arrow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {annotations.length === 0 && !showAddMenu && (
        <p className="text-xs text-gray-500 text-center italic">
          No annotations added yet
        </p>
      )}
    </div>
  );
};

export default AnnotationPanel;
