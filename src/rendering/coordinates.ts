/**
 * Coordinate System for Chart Rendering
 *
 * Provides transformation between:
 * - Data space (raw values)
 * - Normalized space (0-1)
 * - Pixel space (PowerPoint points)
 */

import { Dimensions, Axis, AxisBreak } from "../types/vectorChart";

/**
 * Chart layout with margins
 */
export interface ChartLayout {
  /** Outer bounds (full chart area) */
  outer: Dimensions;
  /** Inner plot area (where data is rendered) */
  plot: Dimensions;
  /** Space reserved for axes */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Title area */
  title: Dimensions | null;
  /** Legend area */
  legend: Dimensions | null;
}

/**
 * Scale function that maps data values to pixel positions
 */
export interface Scale {
  domain: [number, number]; // Data range
  range: [number, number]; // Pixel range
  scale: (value: number) => number;
  invert: (pixel: number) => number;
}

/**
 * Create a linear scale
 */
export function createLinearScale(
  domain: [number, number],
  range: [number, number]
): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const domainSpan = d1 - d0;
  const rangeSpan = r1 - r0;

  return {
    domain,
    range,
    scale: (value: number) => {
      if (domainSpan === 0) return r0;
      return r0 + ((value - d0) / domainSpan) * rangeSpan;
    },
    invert: (pixel: number) => {
      if (rangeSpan === 0) return d0;
      return d0 + ((pixel - r0) / rangeSpan) * domainSpan;
    },
  };
}

/**
 * Create a band scale for categories (evenly spaced bands)
 */
export interface BandScale {
  domain: string[];
  range: [number, number];
  bandwidth: number;
  padding: number;
  scale: (category: string) => number;
  center: (category: string) => number;
}

export function createBandScale(
  domain: string[],
  range: [number, number],
  padding: number = 0.1
): BandScale {
  const [r0, r1] = range;
  const rangeSpan = r1 - r0;
  const n = domain.length;

  if (n === 0) {
    return {
      domain,
      range,
      bandwidth: 0,
      padding,
      scale: () => r0,
      center: () => r0,
    };
  }

  const totalPadding = padding * 2 + (n - 1) * padding;
  const bandwidth = rangeSpan / (n + totalPadding);
  const step = bandwidth * (1 + padding);
  const start = r0 + bandwidth * padding;

  const indexMap = new Map(domain.map((d, i) => [d, i]));

  return {
    domain,
    range,
    bandwidth,
    padding,
    scale: (category: string) => {
      const index = indexMap.get(category) ?? 0;
      return start + index * step;
    },
    center: (category: string) => {
      const index = indexMap.get(category) ?? 0;
      return start + index * step + bandwidth / 2;
    },
  };
}

/**
 * Calculate chart layout from dimensions
 */
export function calculateLayout(
  dimensions: Dimensions,
  options: {
    showTitle?: boolean;
    showLegend?: boolean;
    legendPosition?: "bottom" | "right";
    titleHeight?: number;
    legendHeight?: number;
  } = {}
): ChartLayout {
  const {
    showTitle = true,
    showLegend = true,
    legendPosition = "bottom",
    titleHeight = 30,
    legendHeight = 25,
  } = options;

  const margins = {
    top: showTitle ? titleHeight + 10 : 20,
    right: 20,
    bottom: showLegend && legendPosition === "bottom" ? legendHeight + 35 : 30,
    left: 50,
  };

  const outer = dimensions;

  const plot: Dimensions = {
    left: outer.left + margins.left,
    top: outer.top + margins.top,
    width: outer.width - margins.left - margins.right,
    height: outer.height - margins.top - margins.bottom,
  };

  const title: Dimensions | null = showTitle
    ? {
        left: outer.left + outer.width / 2 - 75,
        top: outer.top,
        width: 150,
        height: titleHeight,
      }
    : null;

  const legend: Dimensions | null = showLegend
    ? {
        left: outer.left,
        top: outer.top + outer.height - legendHeight,
        width: outer.width,
        height: legendHeight,
      }
    : null;

  return { outer, plot, margins, title, legend };
}

/**
 * Calculate value axis range from data
 */
export function calculateValueRange(
  values: number[],
  options: {
    minValue?: number | null;
    maxValue?: number | null;
    includeZero?: boolean;
    padding?: number;
  } = {}
): [number, number] {
  const { minValue, maxValue, includeZero = true, padding = 0.1 } = options;

  if (values.length === 0) {
    return [0, 100];
  }

  let min = minValue ?? Math.min(...values);
  let max = maxValue ?? Math.max(...values);

  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  // Add padding
  const range = max - min;
  if (minValue === undefined || minValue === null) {
    min = min - range * padding;
  }
  if (maxValue === undefined || maxValue === null) {
    max = max + range * padding;
  }

  // Ensure non-zero range
  if (max === min) {
    max = min + 1;
  }

  return [min, max];
}

/**
 * Apply axis breaks to transform a value
 * Collapses the coordinate space for break regions
 */
export function applyAxisBreaks(
  value: number,
  breaks: AxisBreak[],
  originalRange: [number, number]
): number {
  if (breaks.length === 0) return value;

  // Sort breaks by start value
  const sortedBreaks = [...breaks].sort((a, b) => a.startValue - b.startValue);

  let adjustedValue = value;
  let totalCollapsed = 0;

  for (const brk of sortedBreaks) {
    if (value > brk.endValue) {
      // Value is after break - shift by break size
      totalCollapsed += brk.endValue - brk.startValue;
    } else if (value > brk.startValue) {
      // Value is within break - clamp to start
      adjustedValue = brk.startValue;
      break;
    }
  }

  return adjustedValue - totalCollapsed;
}

/**
 * Get nice round numbers for axis ticks
 */
export function calculateTicks(
  min: number,
  max: number,
  targetCount: number = 5
): number[] {
  const range = max - min;
  const roughStep = range / targetCount;

  // Round to a nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let niceStep: number;
  if (residual <= 1.5) niceStep = magnitude;
  else if (residual <= 3) niceStep = 2 * magnitude;
  else if (residual <= 7) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const ticks: number[] = [];
  let tick = Math.ceil(min / niceStep) * niceStep;

  while (tick <= max) {
    ticks.push(tick);
    tick += niceStep;
  }

  return ticks;
}
