import React, { useState, useEffect, useCallback } from "react";
import ChartPanel from "../components/ChartPanel";
import Header from "../components/Header";
import { ChartData } from "../types/chartData";
import {
  selectionManager,
  ChartSelection,
} from "../utils/selectionManager";
import { migrateFromLocalStorage } from "../utils/dataStorage";

export type EditorMode = "insert" | "edit";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>("insert");
  const [selectedChart, setSelectedChart] = useState<ChartSelection | null>(
    null
  );

  const showMessage = useCallback((text: string, duration = 3000) => {
    setMessage(text);
    setTimeout(() => setMessage(null), duration);
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Migrate any old localStorage data
    migrateFromLocalStorage().then((count) => {
      if (count > 0) {
        showMessage(`Migrated ${count} chart(s) to document storage`);
      }
    });

    // Start listening for selection changes
    selectionManager.startListening((selection) => {
      setSelectedChart(selection);
      setMode(selection ? "edit" : "insert");
    });

    // Check initial selection
    selectionManager.checkSelection();

    return () => {
      selectionManager.stopListening();
    };
  }, [showMessage]);

  const handleClearSelection = useCallback(() => {
    setSelectedChart(null);
    setMode("insert");
  }, []);

  const handleChartUpdated = useCallback(
    (chartData: ChartData) => {
      showMessage("Chart updated successfully!");
      // Force selection check to refresh state
      selectionManager.forceCheck();
    },
    [showMessage]
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header />

      {/* Mode indicator */}
      {mode === "edit" && selectedChart && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="text-sm font-medium text-blue-700">
              Editing Chart
            </span>
          </div>
          <button
            onClick={handleClearSelection}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Create New
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4">
        <ChartPanel
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          showMessage={showMessage}
          mode={mode}
          selectedChart={selectedChart}
          onClearSelection={handleClearSelection}
          onChartUpdated={handleChartUpdated}
        />
      </main>

      {/* Toast Message */}
      {message && (
        <div className="fixed bottom-4 left-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
};

export default App;
