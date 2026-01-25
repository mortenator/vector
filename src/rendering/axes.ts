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

import { Axis, AxisBreak, VectorChart } from "../types/vectorChart";
import { ChartLayout, Scale, BandScale, calculateTicks } from "./coordinates";
import { ShapeDescriptor } from "./pipeline";

/**
 * Axis break visual styles
 */
export interface AxisBreakStyle {
  width: number;
  height: number;
  color: string;
  backgroundColor: string;
}

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

  // Only generate axes for bar/column/line/waterfall charts
  if (["bar", "column", "line", "area", "waterfall"].includes(chart.type)) {
    // Use Y-axis with breaks if available
    shapes.push(...generateYAxisWithBreaks(chart, layout, scales.y, options));
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

// ============================================================================
// Axis Break Rendering
// ============================================================================

const defaultBreakStyle: AxisBreakStyle = {
  width: 20,
  height: 12,
  color: "#9ca3af",
  backgroundColor: "#f8fafc",
};

/**
 * Generate axis break shapes (zigzag pattern)
 */
export function generateAxisBreakShapes(
  chart: VectorChart,
  layout: ChartLayout,
  yScale: Scale,
  axisBreak: AxisBreak,
  style: AxisBreakStyle = defaultBreakStyle
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];

  // Calculate the Y position for the break (center of the break range)
  const breakCenterValue = (axisBreak.startValue + axisBreak.endValue) / 2;
  const breakY = yScale.scale(breakCenterValue);

  // Skip if break is outside visible range
  if (breakY < layout.plot.top || breakY > layout.plot.top + layout.plot.height) {
    return shapes;
  }

  const breakLeft = layout.plot.left - 10;
  const breakTop = breakY - style.height / 2;

  if (axisBreak.style === "wiggle") {
    // Zigzag/wiggle pattern - create with small rectangles
    const zigzagWidth = style.width;
    const zigzagHeight = style.height;
    const segments = 4;
    const segmentWidth = zigzagWidth / segments;

    // Background to cover axis line
    shapes.push({
      id: `${chart.id}_break_bg_${axisBreak.id}`,
      type: "rectangle",
      left: breakLeft - 2,
      top: breakTop - 2,
      width: zigzagWidth + 4,
      height: zigzagHeight + 4,
      fill: style.backgroundColor,
      stroke: style.backgroundColor,
      layer: "axis",
    });

    // Create zigzag with small angled rectangles
    for (let i = 0; i < segments; i++) {
      const isUp = i % 2 === 0;
      const x = breakLeft + i * segmentWidth;
      const y1 = isUp ? breakTop : breakTop + zigzagHeight;
      const y2 = isUp ? breakTop + zigzagHeight : breakTop;

      shapes.push({
        id: `${chart.id}_break_zig_${axisBreak.id}_${i}`,
        type: "rectangle",
        left: x,
        top: Math.min(y1, y2) + zigzagHeight / 4,
        width: segmentWidth,
        height: 2,
        fill: style.color,
        stroke: style.color,
        layer: "axis",
      });
    }
  } else {
    // Straight break - two parallel lines
    shapes.push({
      id: `${chart.id}_break_bg_${axisBreak.id}`,
      type: "rectangle",
      left: breakLeft - 2,
      top: breakTop - 2,
      width: style.width + 4,
      height: style.height + 4,
      fill: style.backgroundColor,
      stroke: style.backgroundColor,
      layer: "axis",
    });

    // Top line
    shapes.push({
      id: `${chart.id}_break_top_${axisBreak.id}`,
      type: "rectangle",
      left: breakLeft,
      top: breakTop,
      width: style.width,
      height: 2,
      fill: style.color,
      stroke: style.color,
      layer: "axis",
    });

    // Bottom line
    shapes.push({
      id: `${chart.id}_break_bottom_${axisBreak.id}`,
      type: "rectangle",
      left: breakLeft,
      top: breakTop + style.height - 2,
      width: style.width,
      height: 2,
      fill: style.color,
      stroke: style.color,
      layer: "axis",
    });
  }

  return shapes;
}

/**
 * Generate Y-axis shapes with axis breaks
 */
export function generateYAxisWithBreaks(
  chart: VectorChart,
  layout: ChartLayout,
  yScale: Scale,
  options: AxisRenderOptions = {}
): ShapeDescriptor[] {
  const shapes = generateYAxisShapes(chart, layout, yScale, options);

  // Add axis break visuals
  const yAxis = chart.axes.find((a) => a.orientation === "y");
  if (yAxis?.breaks && yAxis.breaks.length > 0) {
    for (const axisBreak of yAxis.breaks) {
      shapes.push(...generateAxisBreakShapes(chart, layout, yScale, axisBreak));
    }
  }

  return shapes;
}

/**
 * Create an axis break helper
 */
export function createAxisBreak(
  startValue: number,
  endValue: number,
  style: "wiggle" | "straight" = "wiggle"
): AxisBreak {
  return {
    id: `break_${Date.now()}`,
    startValue,
    endValue,
    style,
  };
}
