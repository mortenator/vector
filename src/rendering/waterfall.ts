/**
 * Waterfall Chart Rendering
 *
 * Waterfall charts visualize cumulative effect of sequential positive/negative values.
 * Used extensively in financial presentations (revenue bridges, variance analysis).
 *
 * Features:
 * - Running total calculation
 * - Floating bars (each bar starts where previous ended)
 * - Color coding: positive (green), negative (red), total (blue/gray)
 * - Connector lines between bars
 * - Support for subtotal columns
 */

import {
  VectorChart,
  Category,
  DEFAULT_COLORS,
} from "../types/vectorChart";
import { ChartLayout, Scale, BandScale } from "./coordinates";
import { ShapeDescriptor } from "./pipeline";

/**
 * Waterfall bar colors
 */
export interface WaterfallColors {
  positive: string;
  negative: string;
  total: string;
  subtotal: string;
  connector: string;
}

/**
 * Default waterfall color scheme
 */
export const defaultWaterfallColors: WaterfallColors = {
  positive: "#10b981", // Green
  negative: "#ef4444", // Red
  total: "#3b82f6",    // Blue
  subtotal: "#6b7280", // Gray
  connector: "#9ca3af", // Light gray
};

/**
 * Calculated waterfall bar data
 */
interface WaterfallBar {
  categoryIndex: number;
  category: Category;
  value: number;
  runningTotal: number;
  barTop: number;
  barBottom: number;
  barHeight: number;
  isPositive: boolean;
  isTotal: boolean;
  color: string;
}

/**
 * Calculate waterfall bar positions
 */
export function calculateWaterfallBars(
  chart: VectorChart,
  scales: { x: BandScale; y: Scale },
  colors: WaterfallColors = defaultWaterfallColors
): WaterfallBar[] {
  const bars: WaterfallBar[] = [];

  // Use first series for waterfall data
  const series = chart.series[0];
  if (!series) return bars;

  let runningTotal = 0;

  chart.categories.forEach((category, catIndex) => {
    const dataPoint = series.dataPoints[catIndex];
    const value = dataPoint?.value ?? 0;
    const isTotal = category.isTotal;

    let barTop: number;
    let barBottom: number;
    let barHeight: number;
    let displayTotal: number;
    let color: string;

    if (isTotal) {
      // Total bar: starts at 0, goes to running total
      displayTotal = runningTotal;
      barTop = scales.y.scale(Math.max(runningTotal, 0));
      barBottom = scales.y.scale(Math.min(runningTotal, 0));
      barHeight = Math.abs(barTop - barBottom);
      color = colors.total;
    } else {
      // Regular bar: floating from previous running total
      const previousTotal = runningTotal;
      runningTotal += value;
      displayTotal = runningTotal;

      if (value >= 0) {
        barTop = scales.y.scale(runningTotal);
        barBottom = scales.y.scale(previousTotal);
        color = colors.positive;
      } else {
        barTop = scales.y.scale(previousTotal);
        barBottom = scales.y.scale(runningTotal);
        color = colors.negative;
      }
      barHeight = Math.abs(barTop - barBottom);
    }

    bars.push({
      categoryIndex: catIndex,
      category,
      value: isTotal ? displayTotal : value,
      runningTotal: displayTotal,
      barTop,
      barBottom,
      barHeight: Math.max(barHeight, 1),
      isPositive: value >= 0,
      isTotal,
      color,
    });
  });

  return bars;
}

/**
 * Generate waterfall chart shapes
 */
export function generateWaterfallShapes(
  chart: VectorChart,
  layout: ChartLayout,
  scales: { x: BandScale; y: Scale },
  colors: WaterfallColors = defaultWaterfallColors
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];
  const bars = calculateWaterfallBars(chart, scales, colors);

  const bandwidth = scales.x.bandwidth;
  const barWidth = bandwidth * 0.6;
  const barOffset = (bandwidth - barWidth) / 2;

  bars.forEach((bar, index) => {
    const x = scales.x.scale(bar.category.label) + barOffset;

    // Main bar
    shapes.push({
      id: `${chart.id}_waterfall_bar_${index}`,
      type: "rectangle",
      left: x,
      top: bar.barTop,
      width: barWidth,
      height: bar.barHeight,
      fill: bar.color,
      stroke: bar.color,
      elementTag: `waterfall:0:${index}`,
      chartId: chart.id,
      layer: "data",
    });

    // Connector line to next bar (except for last bar and before totals)
    if (index < bars.length - 1) {
      const nextBar = bars[index + 1];
      const connectorY = bar.isTotal
        ? scales.y.scale(bar.runningTotal)
        : scales.y.scale(bar.runningTotal);

      // Only draw connector if next bar is not a total
      if (!nextBar.isTotal) {
        const connectorStartX = x + barWidth;
        const nextX = scales.x.scale(nextBar.category.label) + barOffset;

        shapes.push({
          id: `${chart.id}_waterfall_connector_${index}`,
          type: "rectangle",
          left: connectorStartX,
          top: connectorY - 0.5,
          width: nextX - connectorStartX,
          height: 1,
          fill: colors.connector,
          stroke: colors.connector,
          layer: "data",
        });
      }
    }
  });

  return shapes;
}

/**
 * Generate waterfall data labels
 */
export function generateWaterfallLabels(
  chart: VectorChart,
  layout: ChartLayout,
  scales: { x: BandScale; y: Scale },
  showValues: boolean = true,
  showTotals: boolean = true
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];
  const bars = calculateWaterfallBars(chart, scales);

  const bandwidth = scales.x.bandwidth;
  const barWidth = bandwidth * 0.6;
  const barOffset = (bandwidth - barWidth) / 2;

  bars.forEach((bar, index) => {
    if (!showValues && !bar.isTotal) return;
    if (!showTotals && bar.isTotal) return;

    const x = scales.x.scale(bar.category.label) + barOffset;
    const labelY = bar.isPositive || bar.isTotal ? bar.barTop - 18 : bar.barBottom + 2;

    // Format value
    let labelText: string;
    if (bar.isTotal) {
      labelText = formatWaterfallValue(bar.runningTotal);
    } else {
      const sign = bar.value >= 0 ? "+" : "";
      labelText = sign + formatWaterfallValue(bar.value);
    }

    shapes.push({
      id: `${chart.id}_waterfall_label_${index}`,
      type: "textbox",
      left: x,
      top: labelY,
      width: barWidth,
      height: 16,
      text: labelText,
      fontSize: 9,
      textAlign: "center",
      layer: "label",
    });
  });

  return shapes;
}

/**
 * Format waterfall value for display
 */
function formatWaterfallValue(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  } else if (Number.isInteger(value)) {
    return value.toString();
  } else {
    return value.toFixed(1);
  }
}

/**
 * Calculate the value range for waterfall chart (includes running totals)
 */
export function calculateWaterfallRange(chart: VectorChart): [number, number] {
  const series = chart.series[0];
  if (!series) return [0, 100];

  let runningTotal = 0;
  let minValue = 0;
  let maxValue = 0;

  chart.categories.forEach((category, catIndex) => {
    const dataPoint = series.dataPoints[catIndex];
    const value = dataPoint?.value ?? 0;

    if (!category.isTotal) {
      runningTotal += value;
    }

    minValue = Math.min(minValue, runningTotal);
    maxValue = Math.max(maxValue, runningTotal);
  });

  // Add some padding
  const range = maxValue - minValue;
  const padding = range * 0.1;

  return [
    Math.min(0, minValue - padding),
    maxValue + padding,
  ];
}

/**
 * Create sample waterfall data (for testing)
 */
export function createSampleWaterfallData(): (string | number | null)[][] {
  return [
    [null, "Start", "Product A", "Product B", "Costs", "Marketing", "Total"],
    ["Revenue", 100, 50, 30, -40, -20, 0],
  ];
}

/**
 * Mark categories as totals in a VectorChart
 */
export function markWaterfallTotals(
  chart: VectorChart,
  totalIndices: number[]
): VectorChart {
  return {
    ...chart,
    categories: chart.categories.map((cat, index) => ({
      ...cat,
      isTotal: totalIndices.includes(index),
    })),
  };
}
