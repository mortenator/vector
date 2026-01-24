/* global PowerPoint, Office */

/**
 * Selection Manager
 *
 * Detects when a user selects a Vector chart in PowerPoint
 * and loads the associated chart data for editing.
 */

import { ChartData } from "../types/chartData";
import {
  getChartIdFromShape,
  loadChartPersistent,
  getElementInfoFromShape,
} from "./dataStorage";

/**
 * Information about the currently selected chart
 */
export interface ChartSelection {
  /** The chart ID */
  chartId: string;
  /** The loaded chart data */
  chartData: ChartData;
  /** Selected element info (if a specific bar/point is selected) */
  selectedElement: {
    type: string;
    seriesIndex: number;
    categoryIndex: number;
  } | null;
}

/**
 * Callback for selection changes
 */
export type SelectionChangeCallback = (
  selection: ChartSelection | null
) => void;

/**
 * Selection manager class
 */
class SelectionManager {
  private callback: SelectionChangeCallback | null = null;
  private isListening = false;
  private lastChartId: string | null = null;

  /**
   * Start listening for selection changes
   */
  startListening(callback: SelectionChangeCallback): void {
    this.callback = callback;

    if (this.isListening) return;

    // Register for selection changed events
    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      this.handleSelectionChange.bind(this),
      (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          this.isListening = true;
          // Check initial selection
          this.checkSelection();
        }
      }
    );
  }

  /**
   * Stop listening for selection changes
   */
  stopListening(): void {
    if (!this.isListening) return;

    Office.context.document.removeHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      { handler: this.handleSelectionChange.bind(this) },
      () => {
        this.isListening = false;
        this.callback = null;
      }
    );
  }

  /**
   * Handle selection change event
   */
  private handleSelectionChange(): void {
    this.checkSelection();
  }

  /**
   * Check the current selection for Vector charts
   */
  async checkSelection(): Promise<ChartSelection | null> {
    try {
      const selection = await this.getSelectedChartInfo();

      // Only notify if selection changed
      if (selection?.chartId !== this.lastChartId) {
        this.lastChartId = selection?.chartId || null;
        this.callback?.(selection);
      }

      return selection;
    } catch {
      // Selection check failed, clear selection
      if (this.lastChartId !== null) {
        this.lastChartId = null;
        this.callback?.(null);
      }
      return null;
    }
  }

  /**
   * Get information about the currently selected chart
   */
  private async getSelectedChartInfo(): Promise<ChartSelection | null> {
    return PowerPoint.run(async (context) => {
      // Get selected shapes
      const selection = context.presentation.getSelectedShapes();
      selection.load("items");
      await context.sync();

      if (selection.items.length === 0) {
        return null;
      }

      // Check each selected shape for Vector chart tags
      for (const shape of selection.items) {
        const chartId = await getChartIdFromShape(context, shape);

        if (chartId) {
          // Load the chart data
          const chartData = await loadChartPersistent(chartId);

          if (chartData) {
            // Check if a specific element is selected
            const elementInfo = await getElementInfoFromShape(context, shape);

            return {
              chartId,
              chartData,
              selectedElement: elementInfo,
            };
          }
        }
      }

      return null;
    });
  }

  /**
   * Force a selection check (useful after chart operations)
   */
  async forceCheck(): Promise<ChartSelection | null> {
    this.lastChartId = null; // Reset to ensure callback fires
    return this.checkSelection();
  }
}

// Singleton instance
export const selectionManager = new SelectionManager();

/**
 * Hook-like function to check selection once
 */
export async function checkForSelectedChart(): Promise<ChartSelection | null> {
  return selectionManager.checkSelection();
}
