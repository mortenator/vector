import React, { useState } from "react";
import { insertChart, ChartType } from "../utils/chartUtils";
import { ChartData, createDefaultChartData } from "../types/chartData";
import DataGrid from "./DataGrid";

interface ChartPanelProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showMessage: (message: string) => void;
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
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="4,18 9,12 14,16 20,6" strokeLinecap="round" strokeLinejoin="round" />
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
}) => {
  const [selectedChart, setSelectedChart] = useState<ChartType>("bar");
  const [chartData, setChartData] = useState<ChartData>(() =>
    createDefaultChartData("bar")
  );

  const handleChartTypeChange = (type: ChartType) => {
    setSelectedChart(type);
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
        type: selectedChart,
        id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      await insertChart(selectedChart, dataToInsert);
      showMessage(
        `${selectedChart.charAt(0).toUpperCase() + selectedChart.slice(1)} chart inserted!`
      );
    } catch (error) {
      console.error("Error inserting chart:", error);
      showMessage("Failed to insert chart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = () => {
    setChartData(createDefaultChartData(selectedChart));
    showMessage("Data reset to defaults");
  };

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
            Reset to defaults
          </button>
        </div>
      </section>

      {/* Chart Type Selection */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Select Chart Type
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {chartTypes.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => handleChartTypeChange(type)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                ${
                  selectedChart === type
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

      {/* Insert Button */}
      <section>
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Insert Chart
            </span>
          )}
        </button>
      </section>

      {/* Help Text */}
      <section className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800">
          <strong>Tip:</strong> Edit the data in the grid above, select a chart
          type, and click "Insert Chart" to add it to the current slide. You can
          import data from Excel using the "Import Excel" button.
        </p>
      </section>
    </div>
  );
};

export default ChartPanel;
