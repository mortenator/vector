/**
 * Annotation Rendering
 *
 * Handles rendering of chart annotations including:
 * - Difference arrows (showing delta between values)
 * - Value lines (horizontal/vertical reference lines)
 * - CAGR arrows (compound annual growth rate)
 */

import {
  VectorChart,
  Annotation,
  Anchor,
  Series,
  Category,
  DataPoint,
} from "../types/vectorChart";
import { ChartLayout, Scale, BandScale } from "./coordinates";
import { ShapeDescriptor } from "./pipeline";

/**
 * Annotation configuration for rendering
 */
export interface AnnotationConfig {
  /** Difference arrow settings */
  diffArrow?: {
    fromSeriesIndex: number;
    fromCategoryIndex: number;
    toSeriesIndex: number;
    toCategoryIndex: number;
    showValue: boolean;
    showPercent: boolean;
  };
  /** Value line settings */
  valueLine?: {
    value: number;
    label?: string;
    color: string;
    style: "solid" | "dashed";
  };
  /** CAGR arrow settings */
  cagr?: {
    fromCategoryIndex: number;
    toCategoryIndex: number;
    seriesIndex: number;
  };
}

/**
 * Simple annotation that can be added via UI
 */
export interface SimpleAnnotation {
  id: string;
  type: "diffArrow" | "valueLine" | "cagr";
  enabled: boolean;
  config: AnnotationConfig;
}

/**
 * Generate difference arrow shapes
 */
export function generateDiffArrowShapes(
  chart: VectorChart,
  layout: ChartLayout,
  scales: { x: BandScale; y: Scale },
  config: AnnotationConfig["diffArrow"]
): ShapeDescriptor[] {
  if (!config) return [];

  const shapes: ShapeDescriptor[] = [];
  const {
    fromSeriesIndex,
    fromCategoryIndex,
    toSeriesIndex,
    toCategoryIndex,
    showValue,
    showPercent,
  } = config;

  // Get the data points
  const fromSeries = chart.series[fromSeriesIndex];
  const toSeries = chart.series[toSeriesIndex];
  if (!fromSeries || !toSeries) return [];

  const fromPoint = fromSeries.dataPoints[fromCategoryIndex];
  const toPoint = toSeries.dataPoints[toCategoryIndex];
  if (!fromPoint || !toPoint) return [];

  const fromValue = fromPoint.value ?? 0;
  const toValue = toPoint.value ?? 0;
  const diff = toValue - fromValue;
  const percentChange = fromValue !== 0 ? (diff / fromValue) * 100 : 0;

  // Calculate positions
  const fromCategory = chart.categories[fromCategoryIndex];
  const toCategory = chart.categories[toCategoryIndex];

  const numSeries = chart.series.length;
  const bandwidth = scales.x.bandwidth;
  const barWidth = (bandwidth * 0.8) / numSeries;

  const fromX =
    scales.x.scale(fromCategory.label) + fromSeriesIndex * barWidth + barWidth / 2;
  const toX =
    scales.x.scale(toCategory.label) + toSeriesIndex * barWidth + barWidth / 2;

  const fromY = scales.y.scale(fromValue);
  const toY = scales.y.scale(toValue);

  // Arrow line (vertical part)
  const arrowX = Math.max(fromX, toX) + 20;
  const arrowTop = Math.min(fromY, toY);
  const arrowHeight = Math.abs(toY - fromY);

  // Vertical line
  shapes.push({
    id: `${chart.id}_diffarrow_line`,
    type: "rectangle",
    left: arrowX,
    top: arrowTop,
    width: 2,
    height: arrowHeight,
    fill: "#6b7280",
    stroke: "#6b7280",
    layer: "label",
  });

  // Top horizontal connector
  shapes.push({
    id: `${chart.id}_diffarrow_top`,
    type: "rectangle",
    left: Math.min(fromX, arrowX),
    top: fromY - 1,
    width: Math.abs(arrowX - fromX),
    height: 2,
    fill: "#6b7280",
    stroke: "#6b7280",
    layer: "label",
  });

  // Bottom horizontal connector
  shapes.push({
    id: `${chart.id}_diffarrow_bottom`,
    type: "rectangle",
    left: Math.min(toX, arrowX),
    top: toY - 1,
    width: Math.abs(arrowX - toX),
    height: 2,
    fill: "#6b7280",
    stroke: "#6b7280",
    layer: "label",
  });

  // Arrow head (triangle approximation using small rectangle)
  const arrowDirection = toValue > fromValue ? -1 : 1;
  shapes.push({
    id: `${chart.id}_diffarrow_head`,
    type: "rectangle",
    left: arrowX - 3,
    top: arrowDirection > 0 ? arrowTop + arrowHeight - 8 : arrowTop,
    width: 8,
    height: 8,
    fill: "#6b7280",
    stroke: "#6b7280",
    layer: "label",
  });

  // Label
  if (showValue || showPercent) {
    let labelText = "";
    if (showValue) {
      const sign = diff >= 0 ? "+" : "";
      labelText = `${sign}${formatNumber(diff)}`;
    }
    if (showPercent) {
      const sign = percentChange >= 0 ? "+" : "";
      labelText += showValue
        ? ` (${sign}${percentChange.toFixed(1)}%)`
        : `${sign}${percentChange.toFixed(1)}%`;
    }

    shapes.push({
      id: `${chart.id}_diffarrow_label`,
      type: "textbox",
      left: arrowX + 5,
      top: arrowTop + arrowHeight / 2 - 8,
      width: 60,
      height: 16,
      text: labelText,
      fontSize: 9,
      textAlign: "left",
      layer: "label",
    });
  }

  return shapes;
}

/**
 * Generate value line shapes
 */
export function generateValueLineShapes(
  chart: VectorChart,
  layout: ChartLayout,
  scales: { x: BandScale; y: Scale },
  config: AnnotationConfig["valueLine"]
): ShapeDescriptor[] {
  if (!config) return [];

  const shapes: ShapeDescriptor[] = [];
  const { value, label, color, style } = config;

  const y = scales.y.scale(value);

  // Skip if outside plot area
  if (y < layout.plot.top || y > layout.plot.top + layout.plot.height) {
    return [];
  }

  // Main line
  shapes.push({
    id: `${chart.id}_valueline`,
    type: "rectangle",
    left: layout.plot.left,
    top: y - 1,
    width: layout.plot.width,
    height: style === "dashed" ? 1 : 2,
    fill: color,
    stroke: color,
    layer: "label",
  });

  // For dashed lines, we'd need multiple small segments
  // PowerPoint shapes don't have native dash support, so we approximate
  if (style === "dashed") {
    const dashWidth = 8;
    const gapWidth = 4;
    let currentX = layout.plot.left;

    // Clear the solid line and replace with dashes
    shapes.pop();

    let dashIndex = 0;
    while (currentX < layout.plot.left + layout.plot.width) {
      shapes.push({
        id: `${chart.id}_valueline_dash_${dashIndex}`,
        type: "rectangle",
        left: currentX,
        top: y - 1,
        width: Math.min(dashWidth, layout.plot.left + layout.plot.width - currentX),
        height: 2,
        fill: color,
        stroke: color,
        layer: "label",
      });
      currentX += dashWidth + gapWidth;
      dashIndex++;
    }
  }

  // Label
  if (label) {
    shapes.push({
      id: `${chart.id}_valueline_label`,
      type: "textbox",
      left: layout.plot.left + layout.plot.width + 5,
      top: y - 8,
      width: 50,
      height: 16,
      text: label,
      fontSize: 9,
      textAlign: "left",
      layer: "label",
    });
  }

  return shapes;
}

/**
 * Generate CAGR (Compound Annual Growth Rate) arrow shapes
 */
export function generateCagrShapes(
  chart: VectorChart,
  layout: ChartLayout,
  scales: { x: BandScale; y: Scale },
  config: AnnotationConfig["cagr"]
): ShapeDescriptor[] {
  if (!config) return [];

  const shapes: ShapeDescriptor[] = [];
  const { fromCategoryIndex, toCategoryIndex, seriesIndex } = config;

  const series = chart.series[seriesIndex];
  if (!series) return [];

  const fromPoint = series.dataPoints[fromCategoryIndex];
  const toPoint = series.dataPoints[toCategoryIndex];
  if (!fromPoint || !toPoint) return [];

  const fromValue = fromPoint.value ?? 0;
  const toValue = toPoint.value ?? 0;

  // Calculate CAGR
  const periods = Math.abs(toCategoryIndex - fromCategoryIndex);
  if (periods === 0 || fromValue <= 0) return [];

  const cagr = (Math.pow(toValue / fromValue, 1 / periods) - 1) * 100;

  // Calculate positions
  const fromCategory = chart.categories[fromCategoryIndex];
  const toCategory = chart.categories[toCategoryIndex];

  const fromX = scales.x.center(fromCategory.label);
  const toX = scales.x.center(toCategory.label);
  const fromY = scales.y.scale(fromValue);
  const toY = scales.y.scale(toValue);

  // Curved arrow (approximated with straight line for now)
  const curveHeight = 30;
  const midX = (fromX + toX) / 2;
  const topY = Math.min(fromY, toY) - curveHeight;

  // Left leg
  shapes.push({
    id: `${chart.id}_cagr_left`,
    type: "rectangle",
    left: fromX - 1,
    top: topY,
    width: 2,
    height: fromY - topY,
    fill: "#059669",
    stroke: "#059669",
    layer: "label",
  });

  // Top horizontal
  shapes.push({
    id: `${chart.id}_cagr_top`,
    type: "rectangle",
    left: fromX,
    top: topY - 1,
    width: toX - fromX,
    height: 2,
    fill: "#059669",
    stroke: "#059669",
    layer: "label",
  });

  // Right leg
  shapes.push({
    id: `${chart.id}_cagr_right`,
    type: "rectangle",
    left: toX - 1,
    top: topY,
    width: 2,
    height: toY - topY,
    fill: "#059669",
    stroke: "#059669",
    layer: "label",
  });

  // Arrow head
  shapes.push({
    id: `${chart.id}_cagr_head`,
    type: "rectangle",
    left: toX - 4,
    top: toY - 8,
    width: 8,
    height: 8,
    fill: "#059669",
    stroke: "#059669",
    layer: "label",
  });

  // CAGR label
  const sign = cagr >= 0 ? "+" : "";
  shapes.push({
    id: `${chart.id}_cagr_label`,
    type: "textbox",
    left: midX - 30,
    top: topY - 20,
    width: 60,
    height: 16,
    text: `CAGR: ${sign}${cagr.toFixed(1)}%`,
    fontSize: 9,
    textAlign: "center",
    layer: "label",
  });

  return shapes;
}

/**
 * Generate all annotation shapes
 */
export function generateAnnotationShapes(
  chart: VectorChart,
  layout: ChartLayout,
  scales: { x: BandScale; y: Scale },
  annotations: SimpleAnnotation[]
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];

  for (const annotation of annotations) {
    if (!annotation.enabled) continue;

    switch (annotation.type) {
      case "diffArrow":
        shapes.push(
          ...generateDiffArrowShapes(
            chart,
            layout,
            scales,
            annotation.config.diffArrow
          )
        );
        break;
      case "valueLine":
        shapes.push(
          ...generateValueLineShapes(
            chart,
            layout,
            scales,
            annotation.config.valueLine
          )
        );
        break;
      case "cagr":
        shapes.push(
          ...generateCagrShapes(chart, layout, scales, annotation.config.cagr)
        );
        break;
    }
  }

  return shapes;
}

/**
 * Format number for display
 */
function formatNumber(value: number): string {
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
 * Create a default value line annotation
 */
export function createValueLineAnnotation(
  value: number,
  label?: string
): SimpleAnnotation {
  return {
    id: `annotation_${Date.now()}`,
    type: "valueLine",
    enabled: true,
    config: {
      valueLine: {
        value,
        label: label || formatNumber(value),
        color: "#dc2626",
        style: "dashed",
      },
    },
  };
}

/**
 * Create a default diff arrow annotation
 */
export function createDiffArrowAnnotation(
  fromSeriesIndex: number,
  fromCategoryIndex: number,
  toSeriesIndex: number,
  toCategoryIndex: number
): SimpleAnnotation {
  return {
    id: `annotation_${Date.now()}`,
    type: "diffArrow",
    enabled: true,
    config: {
      diffArrow: {
        fromSeriesIndex,
        fromCategoryIndex,
        toSeriesIndex,
        toCategoryIndex,
        showValue: true,
        showPercent: true,
      },
    },
  };
}
