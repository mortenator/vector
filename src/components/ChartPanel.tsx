import React, { useState, useEffect } from "react";
import {
  insertChart,
  insertChartV2,
  ChartType,
  insertVectorChart,
  chartDataToVectorChart,
} from "../utils/chartUtils";
import { ChartData, createDefaultChartData } from "../types/chartData";
import { Axis, createAxis } from "../types/vectorChart";
import { updateChartPersistent } from "../utils/dataStorage";
import { ChartSelection } from "../utils/selectionManager";
import { EditorMode } from "../taskpane/App";
import DataGrid from "./DataGrid";
import { AxisConfiguration } from "./AxisPanel";

interface ChartPanelProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showMessage: (message: string) => void;
  mode: EditorMode;
  selectedChart: ChartSelection | null;
  onClearSelection: () => void;
  onChartUpdated: (chartData: ChartData) => void;
}

const chartTypes: { type: ChartType; label: string; icon: JSX.Element }[] = [
  {
    type: "bar",
    label: "Bar Chart",
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="8" width="4" height="12" rx="1" />
        <rect x="16" y="4" width="4" height="16" rx="1" />
      </svg>
    ),
  },
  {
    type: "column",
    label: "Column Chart",
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="14" width="4" height="6" rx="1" />
        <rect x="10" y="10" width="4" height="10" rx="1" />
        <rect x="16" y="6" width="4" height="14" rx="1" />
      </svg>
    ),
  },
  {
    type: "line",
    label: "Line Chart",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline
          points="4,18 9,12 14,16 20,6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="4" cy="18" r="2" fill="currentColor" />
        <circle cx="9" cy="12" r="2" fill="currentColor" />
        <circle cx="14" cy="16" r="2" fill="currentColor" />
        <circle cx="20" cy="6" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    type: "pie",
    label: "Pie Chart",
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v8l6.93 4.01C17.46 17.9 14.9 20 12 20z" />
      </svg>
    ),
  },
];

const ChartPanel: React.FC<ChartPanelProps> = ({
  isLoading,
  setIsLoading,
  showMessage,
  mode,
  selectedChart,
  onClearSelection,
  onChartUpdated,
}) => {
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("bar");
  const [chartData, setChartData] = useState<ChartData>(() =>
    createDefaultChartData("bar")
  );
  const [axes, setAxes] = useState<Axis[]>(() => [
    createAxis("category", "x"),
    createAxis("value", "y"),
  ]);
  const [showAxisConfig, setShowAxisConfig] = useState(false);

  // Load selected chart data when selection changes
  useEffect(() => {
    if (mode === "edit" && selectedChart) {
      setChartData(selectedChart.chartData);
      setSelectedChartType(selectedChart.chartData.type);
      // Reset axes for now - TODO: load from stored VectorChart
      setAxes([createAxis("category", "x"), createAxis("value", "y")]);
    }
  }, [mode, selectedChart]);

  const handleChartTypeChange = (type: ChartType) => {
    setSelectedChartType(type);
    setChartData((prev) => ({ ...prev, type }));
  };

  const handleDataChange = (newData: ChartData) => {
    setChartData(newData);
  };

  const handleInsertChart = async () => {
    setIsLoading(true);
    try {
      // Update chart data with selected type and generate new ID
      const dataToInsert: ChartData = {
        ...chartData,
        type: selectedChartType,
        id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Convert to VectorChart and apply axis configuration
      const vectorChart = chartDataToVectorChart(
        dataToInsert,
        selectedChartType as any
      );
      vectorChart.axes = axes;

      // Use new rendering pipeline with VectorChart
      await insertVectorChart(vectorChart);

      showMessage(
        `${selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} chart inserted!`
      );
    } catch (error) {
      console.error("Error inserting chart:", error);
      showMessage("Failed to insert chart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateChart = async () => {
    if (!selectedChart) return;

    setIsLoading(true);
    try {
      // Update the chart data in storage
      const updatedData: ChartData = {
        ...chartData,
        id: selectedChart.chartId,
        type: selectedChartType,
      };

      await updateChartPersistent(updatedData);

      // TODO: Re-render the chart shapes on the slide
      // For now, just update the data storage
      // Full re-render requires deleting old shapes and creating new ones

      onChartUpdated(updatedData);
      showMessage("Chart data updated! Re-insert to see visual changes.");
    } catch (error) {
      console.error("Error updating chart:", error);
      showMessage("Failed to update chart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = () => {
    if (mode === "edit" && selectedChart) {
      // Reset to original selected chart data
      setChartData(selectedChart.chartData);
      setSelectedChartType(selectedChart.chartData.type);
      showMessage("Data reset to original");
    } else {
      // Reset to defaults
      setChartData(createDefaultChartData(selectedChartType));
      showMessage("Data reset to defaults");
    }
  };

  const isEditMode = mode === "edit" && selectedChart !== null;

  return (
    <div className="space-y-4">
      {/* Data Grid Editor */}
      <section className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <DataGrid data={chartData} onChange={handleDataChange} />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleResetData}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {isEditMode ? "Reset to original" : "Reset to defaults"}
          </button>
        </div>
      </section>

      {/* Chart Type Selection */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          {isEditMode ? "Change Chart Type" : "Select Chart Type"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {chartTypes.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => handleChartTypeChange(type)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                ${
                  selectedChartType === type
                    ? "border-blue-500 bg-blue-50 text-blue-600 shadow-md"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <div className="mb-2">{icon}</div>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Axis Configuration (collapsible) */}
      {selectedChartType !== "pie" && (
        <section className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          <button
            onClick={() => setShowAxisConfig(!showAxisConfig)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
          >
            <span>Axis Settings</span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${showAxisConfig ? "rotate-180" : ""}`}
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
          {showAxisConfig && (
            <div className="mt-3">
              <AxisConfiguration axes={axes} onChange={setAxes} />
            </div>
          )}
        </section>
      )}

      {/* Action Button */}
      <section>
        {isEditMode ? (
          <div className="space-y-2">
            <button
              onClick={handleUpdateChart}
              disabled={isLoading}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold text-white text-base
                transition-all duration-200 shadow-lg
                ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-xl active:scale-[0.98]"
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Updating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Update Chart
                </span>
              )}
            </button>
            <button
              onClick={onClearSelection}
              className="w-full py-2 px-4 rounded-lg text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Cancel and Create New
            </button>
          </div>
        ) : (
          <button
            onClick={handleInsertChart}
            disabled={isLoading}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-white text-base
              transition-all duration-200 shadow-lg
              ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl active:scale-[0.98]"
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Inserting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
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
                Insert Chart
              </span>
            )}
          </button>
        )}
      </section>

      {/* Help Text */}
      <section className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800">
          {isEditMode ? (
            <>
              <strong>Editing:</strong> Modify the data above and click "Update
              Chart" to save changes. The chart will update when you re-select
              it or re-insert.
            </>
          ) : (
            <>
              <strong>Tip:</strong> Edit the data in the grid above, select a
              chart type, and click "Insert Chart" to add it to the current
              slide. Click on an existing Vector chart to edit it.
            </>
          )}
        </p>
      </section>
    </div>
  );
};

export default ChartPanel;
