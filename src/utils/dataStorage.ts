/* global PowerPoint */

import { ChartData, StoredChartData } from "../types/chartData";
import {
  saveChartToXml,
  updateChartInXml,
  loadChartFromXml,
  listAllCharts,
  deleteChartFromXml,
  loadAllChartsFromXml,
  VectorChartStorage,
} from "./xmlStorage";

// Shape tag keys
const VECTOR_DATA_TAG = "VECTOR_CHART_DATA"; // Legacy - for backwards compat
const VECTOR_CHART_ID_TAG = "VECTOR_CHART_ID"; // New - links shape to XML storage
const VECTOR_ELEMENT_TAG = "VECTOR_ELEMENT"; // For individual elements (bars, points)

// Deprecated - only used for migration
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
 * @deprecated Use deleteChartFromXml instead
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

// ============================================================================
// NEW: Document-persistent storage via Office Settings API
// ============================================================================

/**
 * Tag a shape group with the chart ID for later retrieval
 */
export async function tagShapeWithChartId(
  shape: PowerPoint.Shape,
  chartId: string
): Promise<void> {
  shape.tags.add(VECTOR_CHART_ID_TAG, chartId);
}

/**
 * Tag an individual element (bar, point, etc.) for click detection
 * Format: "type:seriesIndex:categoryIndex" e.g. "bar:0:2"
 */
export async function tagElementShape(
  shape: PowerPoint.Shape,
  elementType: string,
  seriesIndex: number,
  categoryIndex: number
): Promise<void> {
  shape.tags.add(
    VECTOR_ELEMENT_TAG,
    `${elementType}:${seriesIndex}:${categoryIndex}`
  );
}

/**
 * Get the chart ID from a shape's tags
 */
export async function getChartIdFromShape(
  context: PowerPoint.RequestContext,
  shape: PowerPoint.Shape
): Promise<string | null> {
  shape.tags.load("items");
  await context.sync();

  const tag = shape.tags.items.find(
    (t: PowerPoint.Tag) => t.key === VECTOR_CHART_ID_TAG
  );

  if (tag) {
    tag.load("value");
    await context.sync();
    return tag.value;
  }

  // Fallback: check for legacy tag
  const legacyTag = shape.tags.items.find(
    (t: PowerPoint.Tag) => t.key === VECTOR_DATA_TAG
  );

  if (legacyTag) {
    legacyTag.load("value");
    await context.sync();
    try {
      const stored: StoredChartData = JSON.parse(legacyTag.value);
      return stored.chartId;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Get element info from a shape's tags
 */
export async function getElementInfoFromShape(
  context: PowerPoint.RequestContext,
  shape: PowerPoint.Shape
): Promise<{ type: string; seriesIndex: number; categoryIndex: number } | null> {
  shape.tags.load("items");
  await context.sync();

  const tag = shape.tags.items.find(
    (t: PowerPoint.Tag) => t.key === VECTOR_ELEMENT_TAG
  );

  if (tag) {
    tag.load("value");
    await context.sync();
    const parts = tag.value.split(":");
    if (parts.length === 3) {
      return {
        type: parts[0],
        seriesIndex: parseInt(parts[1], 10),
        categoryIndex: parseInt(parts[2], 10),
      };
    }
  }

  return null;
}

/**
 * Save chart to document-persistent storage (new method)
 */
export async function saveChartPersistent(data: ChartData): Promise<void> {
  await saveChartToXml(data.id, data);
}

/**
 * Update chart in document-persistent storage
 */
export async function updateChartPersistent(data: ChartData): Promise<void> {
  await updateChartInXml(data.id, data);
}

/**
 * Load chart from document-persistent storage by ID
 */
export async function loadChartPersistent(
  chartId: string
): Promise<ChartData | null> {
  const storage = await loadChartFromXml(chartId);
  return storage?.data || null;
}

/**
 * List all chart IDs from document-persistent storage
 */
export async function listChartsPersistent(): Promise<string[]> {
  return listAllCharts();
}

/**
 * Delete chart from document-persistent storage
 */
export async function deleteChartPersistent(chartId: string): Promise<void> {
  await deleteChartFromXml(chartId);
}

/**
 * Load all charts with metadata from document-persistent storage
 */
export async function loadAllChartsPersistent(): Promise<VectorChartStorage[]> {
  return loadAllChartsFromXml();
}

/**
 * Migrate charts from localStorage to document-persistent storage
 */
export async function migrateFromLocalStorage(): Promise<number> {
  let migratedCount = 0;

  try {
    const existingData = localStorage.getItem(VECTOR_SETTINGS_KEY);
    if (existingData) {
      const chartList: ChartData[] = JSON.parse(existingData);

      for (const chart of chartList) {
        const exists = await loadChartFromXml(chart.id);
        if (!exists) {
          await saveChartToXml(chart.id, chart);
          migratedCount++;
        }
      }

      // Clear localStorage after successful migration
      if (migratedCount > 0) {
        localStorage.removeItem(VECTOR_SETTINGS_KEY);
      }
    }
  } catch {
    // Migration failed, keep localStorage intact
  }

  return migratedCount;
}

// Re-export for convenience
export {
  saveChartToXml,
  updateChartInXml,
  loadChartFromXml,
  listAllCharts,
  deleteChartFromXml,
  loadAllChartsFromXml,
};
