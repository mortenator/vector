/**
 * Type definitions for chart data management
 */

export type ChartType = "bar" | "column" | "line" | "pie";

export interface ChartSeries {
  name: string;
  values: number[];
}

export interface ChartData {
  id: string;
  type: ChartType;
  categories: string[];
  series: ChartSeries[];
}

/**
 * Data structure stored in shape tags
 */
export interface StoredChartData {
  chartId: string;
  data: ChartData;
  createdAt: string;
  updatedAt: string;
}

/**
 * Default sample data for new charts
 */
export function createDefaultChartData(type: ChartType = "bar"): ChartData {
  return {
    id: generateId(),
    type,
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [
      { name: "2023", values: [120, 150, 180, 210] },
      { name: "2024", values: [140, 170, 200, 250] },
    ],
  };
}

/**
 * Generate a unique ID for charts
 */
export function generateId(): string {
  return `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
