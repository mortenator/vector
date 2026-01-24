/* global Office, PowerPoint */

/**
 * CustomXmlParts-style storage for Vector charts using Office Settings API.
 *
 * PowerPoint doesn't have direct CustomXmlParts access like Word/Excel,
 * so we use Office.context.document.settings which persists with the document.
 *
 * Data is stored as JSON wrapped in a settings key per chart:
 * Key: "VECTOR_CHART_{id}"
 * Value: JSON string of VectorChartStorage
 */

import { ChartData } from "../types/chartData";

const VECTOR_CHART_PREFIX = "VECTOR_CHART_";
const VECTOR_CHART_INDEX = "VECTOR_CHART_INDEX";

/**
 * Storage wrapper with metadata
 */
export interface VectorChartStorage {
  id: string;
  version: number;
  data: ChartData;
  createdAt: string;
  updatedAt: string;
}

/**
 * Index of all chart IDs in the document
 */
interface ChartIndex {
  chartIds: string[];
  lastModified: string;
}

/**
 * Save chart data to document settings
 */
export async function saveChartToXml(
  chartId: string,
  data: ChartData
): Promise<void> {
  return new Promise((resolve, reject) => {
    Office.context.document.settings.set(
      `${VECTOR_CHART_PREFIX}${chartId}`,
      JSON.stringify({
        id: chartId,
        version: 1,
        data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as VectorChartStorage)
    );

    // Update the index
    const indexJson = Office.context.document.settings.get(VECTOR_CHART_INDEX);
    let index: ChartIndex = indexJson
      ? JSON.parse(indexJson)
      : { chartIds: [], lastModified: "" };

    if (!index.chartIds.includes(chartId)) {
      index.chartIds.push(chartId);
    }
    index.lastModified = new Date().toISOString();

    Office.context.document.settings.set(
      VECTOR_CHART_INDEX,
      JSON.stringify(index)
    );

    // Persist to document
    Office.context.document.settings.saveAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve();
      } else {
        reject(new Error(result.error?.message || "Failed to save settings"));
      }
    });
  });
}

/**
 * Update existing chart data
 */
export async function updateChartInXml(
  chartId: string,
  data: ChartData
): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingJson = Office.context.document.settings.get(
      `${VECTOR_CHART_PREFIX}${chartId}`
    );

    if (!existingJson) {
      // Chart doesn't exist, create it
      saveChartToXml(chartId, data).then(resolve).catch(reject);
      return;
    }

    const existing: VectorChartStorage = JSON.parse(existingJson);
    const updated: VectorChartStorage = {
      ...existing,
      data,
      updatedAt: new Date().toISOString(),
    };

    Office.context.document.settings.set(
      `${VECTOR_CHART_PREFIX}${chartId}`,
      JSON.stringify(updated)
    );

    Office.context.document.settings.saveAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve();
      } else {
        reject(new Error(result.error?.message || "Failed to save settings"));
      }
    });
  });
}

/**
 * Load chart data from document settings
 */
export async function loadChartFromXml(
  chartId: string
): Promise<VectorChartStorage | null> {
  return new Promise((resolve) => {
    const json = Office.context.document.settings.get(
      `${VECTOR_CHART_PREFIX}${chartId}`
    );

    if (json) {
      try {
        resolve(JSON.parse(json) as VectorChartStorage);
      } catch {
        resolve(null);
      }
    } else {
      resolve(null);
    }
  });
}

/**
 * List all chart IDs in the document
 */
export async function listAllCharts(): Promise<string[]> {
  return new Promise((resolve) => {
    const indexJson = Office.context.document.settings.get(VECTOR_CHART_INDEX);

    if (indexJson) {
      try {
        const index: ChartIndex = JSON.parse(indexJson);
        resolve(index.chartIds);
      } catch {
        resolve([]);
      }
    } else {
      resolve([]);
    }
  });
}

/**
 * Delete chart from document settings
 */
export async function deleteChartFromXml(chartId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Remove the chart data
    Office.context.document.settings.remove(
      `${VECTOR_CHART_PREFIX}${chartId}`
    );

    // Update the index
    const indexJson = Office.context.document.settings.get(VECTOR_CHART_INDEX);
    if (indexJson) {
      try {
        const index: ChartIndex = JSON.parse(indexJson);
        index.chartIds = index.chartIds.filter((id) => id !== chartId);
        index.lastModified = new Date().toISOString();
        Office.context.document.settings.set(
          VECTOR_CHART_INDEX,
          JSON.stringify(index)
        );
      } catch {
        // Ignore index update errors
      }
    }

    Office.context.document.settings.saveAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve();
      } else {
        reject(new Error(result.error?.message || "Failed to save settings"));
      }
    });
  });
}

/**
 * Check if a chart exists in the document
 */
export async function chartExistsInXml(chartId: string): Promise<boolean> {
  const chart = await loadChartFromXml(chartId);
  return chart !== null;
}

/**
 * Migrate a chart from localStorage to document settings
 */
export async function migrateChartToXml(
  chartId: string,
  data: ChartData
): Promise<void> {
  const exists = await chartExistsInXml(chartId);
  if (!exists) {
    await saveChartToXml(chartId, data);
  }
}

/**
 * Load all charts with full data
 */
export async function loadAllChartsFromXml(): Promise<VectorChartStorage[]> {
  const chartIds = await listAllCharts();
  const charts: VectorChartStorage[] = [];

  for (const chartId of chartIds) {
    const chart = await loadChartFromXml(chartId);
    if (chart) {
      charts.push(chart);
    }
  }

  return charts;
}
