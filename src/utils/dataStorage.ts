/* global PowerPoint */

import { ChartData, StoredChartData } from "../types/chartData";

const VECTOR_DATA_TAG = "VECTOR_CHART_DATA";
const VECTOR_SETTINGS_KEY = "vectorChartList";

/**
 * Save chart data to a shape's tags
 */
export async function saveChartDataToShape(
  shape: PowerPoint.Shape,
  data: ChartData
): Promise<void> {
  const storedData: StoredChartData = {
    chartId: data.id,
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  shape.tags.add(VECTOR_DATA_TAG, JSON.stringify(storedData));
}

/**
 * Load chart data from a shape's tags
 */
export async function loadChartDataFromShape(
  context: PowerPoint.RequestContext,
  shape: PowerPoint.Shape
): Promise<ChartData | null> {
  shape.tags.load("items");
  await context.sync();

  const tag = shape.tags.items.find(
    (t: PowerPoint.Tag) => t.key === VECTOR_DATA_TAG
  );
  if (tag) {
    tag.load("value");
    await context.sync();
    try {
      const stored: StoredChartData = JSON.parse(tag.value);
      return stored.data;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save chart list to document settings for persistence
 */
export async function saveChartToSettings(data: ChartData): Promise<void> {
  return PowerPoint.run(async (context) => {
    const settings = context.presentation.load("properties");
    await context.sync();

    // Get existing chart list from document
    let chartList: ChartData[] = [];
    try {
      const existingData = localStorage.getItem(VECTOR_SETTINGS_KEY);
      if (existingData) {
        chartList = JSON.parse(existingData);
      }
    } catch {
      chartList = [];
    }

    // Add or update chart
    const existingIndex = chartList.findIndex((c) => c.id === data.id);
    if (existingIndex >= 0) {
      chartList[existingIndex] = data;
    } else {
      chartList.push(data);
    }

    // Save back
    localStorage.setItem(VECTOR_SETTINGS_KEY, JSON.stringify(chartList));
  });
}

/**
 * Load chart list from document settings
 */
export async function loadChartsFromSettings(): Promise<ChartData[]> {
  try {
    const existingData = localStorage.getItem(VECTOR_SETTINGS_KEY);
    if (existingData) {
      return JSON.parse(existingData);
    }
  } catch {
    // Return empty array on error
  }
  return [];
}

/**
 * Remove a chart from settings by ID
 */
export async function removeChartFromSettings(chartId: string): Promise<void> {
  try {
    const existingData = localStorage.getItem(VECTOR_SETTINGS_KEY);
    if (existingData) {
      const chartList: ChartData[] = JSON.parse(existingData);
      const filtered = chartList.filter((c) => c.id !== chartId);
      localStorage.setItem(VECTOR_SETTINGS_KEY, JSON.stringify(filtered));
    }
  } catch {
    // Ignore errors
  }
}
