/**
 * Smart Label Placement
 *
 * Handles positioning and rendering of data labels on chart elements.
 * Supports automatic positioning, custom offsets, and collision avoidance.
 */

import {
  VectorChart,
  SmartLabel,
  DataPoint,
  Series,
  Category,
  FontStyle,
  LabelContentMode,
} from "../types/vectorChart";
import { ChartLayout, Scale, BandScale } from "./coordinates";
import { ShapeDescriptor } from "./pipeline";

export interface LabelPosition {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  baseline: "top" | "middle" | "bottom";
}

export interface LabelConfig {
  /** Show labels on data points */
  showLabels: boolean;
  /** Label position relative to data point */
  position: "above" | "below" | "center" | "inside" | "outside";
  /** Font size in points */
  fontSize: number;
  /** Font color */
  fontColor: string;
  /** Show as percentage */
  showAsPercent: boolean;
  /** Number of decimal places */
  decimals: number;
  /** Custom number format */
  numberFormat?: string;
}

export const defaultLabelConfig: LabelConfig = {
  showLabels: false,
  position: "above",
  fontSize: 9,
  fontColor: "#374151",
  showAsPercent: false,
  decimals: 0,
};

/**
 * Generate label shapes for bar/column charts
 */
export function generateBarLabels(
  chart: VectorChart,
  layout: ChartLayout,
  scales: { x: BandScale; y: Scale },
  config: LabelConfig,
  horizontal: boolean = false
): ShapeDescriptor[] {
  if (!config.showLabels) return [];

  const shapes: ShapeDescriptor[] = [];
  const numSeries = chart.series.length;
  const bandwidth = scales.x.bandwidth;
  const barWidth = (bandwidth * 0.8) / numSeries;
  const zeroY = scales.y.scale(0);

  chart.series.forEach((series, seriesIndex) => {
    series.dataPoints.forEach((point, catIndex) => {
      const category = chart.categories[catIndex];
      const value = point.value ?? 0;

      if (value === 0 && config.position !== "center") return;

      let labelX: number;
      let labelY: number;
      let labelText = formatLabelValue(value, config);

      if (horizontal) {
        // Horizontal bars
        const groupHeight = layout.plot.height / chart.categories.length;
        const barHeight = (groupHeight * 0.8) / numSeries;
        const barWidth = (value / (scales.y.domain[1] - scales.y.domain[0])) * layout.plot.width * 0.85;

        labelY = layout.plot.top + catIndex * groupHeight + seriesIndex * barHeight + barHeight / 2;

        switch (config.position) {
          case "outside":
            labelX = layout.plot.left + barWidth + 4;
            break;
          case "inside":
            labelX = layout.plot.left + barWidth - 4;
            break;
          case "center":
            labelX = layout.plot.left + barWidth / 2;
            break;
          default:
            labelX = layout.plot.left + barWidth + 4;
        }
      } else {
        // Vertical columns
        const x = scales.x.scale(category.label) + seriesIndex * barWidth + barWidth / 2;
        const valueY = scales.y.scale(value);
        const barHeight = Math.abs(zeroY - valueY);
        const barTop = value >= 0 ? valueY : zeroY;

        labelX = x;

        switch (config.position) {
          case "above":
            labelY = barTop - 4;
            break;
          case "below":
            labelY = barTop + barHeight + 12;
            break;
          case "inside":
            labelY = barTop + barHeight / 2 + 4;
            break;
          case "center":
            labelY = barTop + barHeight / 2 + 4;
            break;
          default:
            labelY = barTop - 4;
        }
      }

      shapes.push({
        id: `${chart.id}_label_${seriesIndex}_${catIndex}`,
        type: "textbox",
        left: labelX - 25,
        top: labelY - 8,
        width: 50,
        height: 16,
        text: labelText,
        fontSize: config.fontSize,
        textAlign: "center",
        layer: "label",
      });
    });
  });

  return shapes;
}

/**
 * Generate label shapes for line charts
 */
export function generateLineLabels(
  chart: VectorChart,
  layout: ChartLayout,
  scales: { x: BandScale; y: Scale },
  config: LabelConfig
): ShapeDescriptor[] {
  if (!config.showLabels) return [];

  const shapes: ShapeDescriptor[] = [];

  chart.series.forEach((series, seriesIndex) => {
    series.dataPoints.forEach((point, catIndex) => {
      const category = chart.categories[catIndex];
      const value = point.value ?? 0;
      const x = scales.x.center(category.label);
      const y = scales.y.scale(value);

      let labelY: number;
      switch (config.position) {
        case "above":
          labelY = y - 14;
          break;
        case "below":
          labelY = y + 14;
          break;
        default:
          labelY = y - 14;
      }

      const labelText = formatLabelValue(value, config);

      shapes.push({
        id: `${chart.id}_label_${seriesIndex}_${catIndex}`,
        type: "textbox",
        left: x - 25,
        top: labelY - 8,
        width: 50,
        height: 16,
        text: labelText,
        fontSize: config.fontSize,
        textAlign: "center",
        layer: "label",
      });
    });
  });

  return shapes;
}

/**
 * Generate all data labels for a chart
 */
export function generateDataLabels(
  chart: VectorChart,
  layout: ChartLayout,
  scales: { x: BandScale; y: Scale },
  config: LabelConfig
): ShapeDescriptor[] {
  switch (chart.type) {
    case "bar":
      return generateBarLabels(chart, layout, scales, config, true);
    case "column":
      return generateBarLabels(chart, layout, scales, config, false);
    case "line":
      return generateLineLabels(chart, layout, scales, config);
    default:
      return [];
  }
}

/**
 * Format a value for label display
 */
export function formatLabelValue(value: number, config: LabelConfig): string {
  if (config.showAsPercent) {
    return (value * 100).toFixed(config.decimals) + "%";
  }

  if (config.numberFormat) {
    // Simple format parsing - could be extended
    return value.toFixed(config.decimals);
  }

  // Smart formatting
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  } else if (Number.isInteger(value)) {
    return value.toString();
  } else {
    return value.toFixed(config.decimals);
  }
}

/**
 * Apply SmartLabel configuration to generate custom label
 */
export function applySmartLabel(
  label: SmartLabel,
  value: number,
  series: Series,
  category: Category
): string {
  switch (label.contentMode) {
    case "auto":
      return value.toString();
    case "custom":
      return label.customText || "";
    case "field":
      if (!label.contentMask) return value.toString();
      return label.contentMask
        .replace("{value}", value.toString())
        .replace("{series}", series.label)
        .replace("{category}", category.label)
        .replace("{percent}", ((value / 100) * 100).toFixed(1) + "%");
    default:
      return value.toString();
  }
}

/**
 * Calculate collision-free label positions (basic implementation)
 * TODO: Implement full collision detection and repositioning
 */
export function adjustForCollisions(
  positions: LabelPosition[],
  labelWidth: number,
  labelHeight: number
): LabelPosition[] {
  // For now, just return positions as-is
  // Full collision detection would check for overlaps and adjust
  return positions;
}
