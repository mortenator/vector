/**
 * Axis Rendering
 *
 * Generates shape descriptors for chart axes including:
 * - Axis lines
 * - Tick marks
 * - Tick labels
 * - Axis title
 * - Grid lines
 */

import { Axis, VectorChart } from "../types/vectorChart";
import { ChartLayout, Scale, BandScale, calculateTicks } from "./coordinates";
import { ShapeDescriptor } from "./pipeline";

export interface AxisRenderOptions {
  showAxisLine?: boolean;
  showTicks?: boolean;
  showTickLabels?: boolean;
  showGridLines?: boolean;
  tickLength?: number;
  tickLabelFontSize?: number;
  gridLineColor?: string;
  axisLineColor?: string;
}

const defaultOptions: AxisRenderOptions = {
  showAxisLine: true,
  showTicks: true,
  showTickLabels: true,
  showGridLines: true,
  tickLength: 5,
  tickLabelFontSize: 9,
  gridLineColor: "#e5e7eb",
  axisLineColor: "#9ca3af",
};

/**
 * Generate Y-axis (value axis) shapes
 */
export function generateYAxisShapes(
  chart: VectorChart,
  layout: ChartLayout,
  yScale: Scale,
  options: AxisRenderOptions = {}
): ShapeDescriptor[] {
  const opts = { ...defaultOptions, ...options };
  const shapes: ShapeDescriptor[] = [];
  const yAxis = chart.axes.find((a) => a.orientation === "y");

  // Calculate tick values
  const [yMin, yMax] = yScale.domain;
  const ticks = calculateTicks(yMin, yMax, 5);

  // Axis line
  if (opts.showAxisLine) {
    shapes.push({
      id: `${chart.id}_yaxis_line`,
      type: "rectangle",
      left: layout.plot.left - 1,
      top: layout.plot.top,
      width: 1,
      height: layout.plot.height,
      fill: opts.axisLineColor,
      stroke: opts.axisLineColor,
      layer: "axis",
    });
  }

  // Ticks and labels
  for (const tickValue of ticks) {
    const y = yScale.scale(tickValue);

    // Skip if outside plot area
    if (y < layout.plot.top || y > layout.plot.top + layout.plot.height) {
      continue;
    }

    // Tick mark
    if (opts.showTicks) {
      shapes.push({
        id: `${chart.id}_yaxis_tick_${tickValue}`,
        type: "rectangle",
        left: layout.plot.left - opts.tickLength!,
        top: y - 0.5,
        width: opts.tickLength!,
        height: 1,
        fill: opts.axisLineColor,
        stroke: opts.axisLineColor,
        layer: "axis",
      });
    }

    // Tick label
    if (opts.showTickLabels) {
      const labelText = formatTickValue(tickValue, yAxis);
      shapes.push({
        id: `${chart.id}_yaxis_label_${tickValue}`,
        type: "textbox",
        left: layout.outer.left,
        top: y - 8,
        width: layout.plot.left - layout.outer.left - opts.tickLength! - 2,
        height: 16,
        text: labelText,
        fontSize: opts.tickLabelFontSize,
        textAlign: "right",
        layer: "axis",
      });
    }

    // Grid line
    if (opts.showGridLines && tickValue !== yMin) {
      shapes.push({
        id: `${chart.id}_ygrid_${tickValue}`,
        type: "rectangle",
        left: layout.plot.left,
        top: y - 0.5,
        width: layout.plot.width,
        height: 1,
        fill: opts.gridLineColor,
        stroke: opts.gridLineColor,
        layer: "axis",
      });
    }
  }

  return shapes;
}

/**
 * Generate X-axis (category axis) shapes for bar/column charts
 */
export function generateXAxisShapes(
  chart: VectorChart,
  layout: ChartLayout,
  xScale: BandScale,
  options: AxisRenderOptions = {}
): ShapeDescriptor[] {
  const opts = { ...defaultOptions, ...options };
  const shapes: ShapeDescriptor[] = [];

  // Axis line
  if (opts.showAxisLine) {
    shapes.push({
      id: `${chart.id}_xaxis_line`,
      type: "rectangle",
      left: layout.plot.left,
      top: layout.plot.top + layout.plot.height,
      width: layout.plot.width,
      height: 1,
      fill: opts.axisLineColor,
      stroke: opts.axisLineColor,
      layer: "axis",
    });
  }

  return shapes;
}

/**
 * Generate all axis shapes for a chart
 */
export function generateAxisShapes(
  chart: VectorChart,
  layout: ChartLayout,
  scales: { x: BandScale; y: Scale },
  options: AxisRenderOptions = {}
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];

  // Only generate axes for bar/column/line charts
  if (["bar", "column", "line", "area"].includes(chart.type)) {
    shapes.push(...generateYAxisShapes(chart, layout, scales.y, options));
    shapes.push(...generateXAxisShapes(chart, layout, scales.x, options));
  }

  return shapes;
}

/**
 * Format a tick value for display
 */
function formatTickValue(value: number, axis?: Axis): string {
  // Use axis number format if available
  if (axis?.dateFormat) {
    return value.toString(); // TODO: Date formatting
  }

  // Smart number formatting
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
 * Calculate nice axis bounds that include the data range
 */
export function calculateNiceAxisBounds(
  dataMin: number,
  dataMax: number,
  includeZero: boolean = true
): { min: number; max: number; step: number } {
  let min = dataMin;
  let max = dataMax;

  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  const range = max - min;
  const roughStep = range / 5;

  // Round to nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let step: number;
  if (residual <= 1.5) step = magnitude;
  else if (residual <= 3) step = 2 * magnitude;
  else if (residual <= 7) step = 5 * magnitude;
  else step = 10 * magnitude;

  // Adjust min/max to nice values
  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;

  return { min, max, step };
}
