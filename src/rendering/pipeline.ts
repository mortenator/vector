/* global PowerPoint */

/**
 * Rendering Pipeline
 *
 * Orchestrates the transformation from VectorChart data model
 * to PowerPoint shapes. Supports incremental updates via diffing.
 */

import {
  VectorChart,
  Series,
  Category,
  DataPoint,
  DEFAULT_COLORS,
} from "../types/vectorChart";
import {
  VectorTheme,
  getDefaultTheme,
  getThemeById,
  getSeriesColor,
} from "../types/theme";
import {
  ChartLayout,
  calculateLayout,
  createLinearScale,
  createBandScale,
  calculateValueRange,
  Scale,
  BandScale,
} from "./coordinates";
import { generateAxisShapes } from "./axes";
import { generateDataLabels, LabelConfig, defaultLabelConfig } from "./labelPlacement";
import { generateAnnotationShapes, SimpleAnnotation } from "./annotations";
import {
  generateWaterfallShapes,
  generateWaterfallLabels,
  calculateWaterfallRange,
  WaterfallColors,
  defaultWaterfallColors,
} from "./waterfall";

// ============================================================================
// Shape Descriptors
// ============================================================================

export type ShapeType = "rectangle" | "ellipse" | "textbox" | "line";

/**
 * Describes a shape to be rendered
 */
export interface ShapeDescriptor {
  id: string;
  type: ShapeType;
  left: number;
  top: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontBold?: boolean;
  textAlign?: "left" | "center" | "right";
  /** Tag to identify this shape for click detection */
  elementTag?: string;
  /** Chart ID this shape belongs to */
  chartId?: string;
  /** Z-order layer */
  layer: "background" | "axis" | "data" | "label" | "legend";
}

/**
 * Result of rendering with shape references
 */
export interface RenderResult {
  backgroundShape: PowerPoint.Shape | null;
  shapes: Map<string, PowerPoint.Shape>;
}

// ============================================================================
// Chart Scales
// ============================================================================

export interface ChartScales {
  x: BandScale;
  y: Scale;
}

/**
 * Calculate scales for a chart
 */
export function calculateScales(
  chart: VectorChart,
  layout: ChartLayout
): ChartScales {
  // Find axis config if present
  const yAxis = chart.axes.find((a) => a.orientation === "y");

  let yMin: number;
  let yMax: number;

  if (chart.type === "waterfall") {
    // Waterfall charts need special range calculation for running totals
    [yMin, yMax] = calculateWaterfallRange(chart);
  } else {
    // Standard charts - get all values for y-axis scaling
    const allValues = chart.series.flatMap((s) =>
      s.dataPoints.map((p) => p.value ?? 0)
    );
    [yMin, yMax] = calculateValueRange(allValues, {
      minValue: yAxis?.minValue,
      maxValue: yAxis?.maxValue,
      includeZero: true,
    });
  }

  // Apply axis overrides if present
  if (yAxis?.minValue != null) yMin = yAxis.minValue;
  if (yAxis?.maxValue != null) yMax = yAxis.maxValue;

  // Category scale (x-axis)
  const categoryLabels = chart.categories.map((c) => c.label);
  const x = createBandScale(
    categoryLabels,
    [layout.plot.left, layout.plot.left + layout.plot.width],
    0.2
  );

  // Value scale (y-axis) - note: y increases downward in PowerPoint
  const y = createLinearScale(
    [yMin, yMax],
    [layout.plot.top + layout.plot.height, layout.plot.top]
  );

  return { x, y };
}

// ============================================================================
// Shape Generation
// ============================================================================

/**
 * Generate all shape descriptors for a chart
 */
export function generateShapeDescriptors(
  chart: VectorChart,
  layout: ChartLayout,
  scales: ChartScales
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];

  // Background
  shapes.push({
    id: `${chart.id}_bg`,
    type: "rectangle",
    left: layout.outer.left,
    top: layout.outer.top,
    width: layout.outer.width,
    height: layout.outer.height,
    fill: "#f8fafc",
    stroke: "#e2e8f0",
    strokeWidth: 1,
    chartId: chart.id,
    layer: "background",
  });

  // Title
  if (layout.title) {
    const titleText = getTitleForChartType(chart.type);
    shapes.push({
      id: `${chart.id}_title`,
      type: "textbox",
      ...layout.title,
      text: titleText,
      fontSize: 14,
      fontBold: true,
      textAlign: "center",
      layer: "label",
    });
  }

  // Axes (grid lines, axis lines, tick marks, labels)
  shapes.push(...generateAxisShapes(chart, layout, scales));

  // Generate data shapes based on chart type
  switch (chart.type) {
    case "bar":
      shapes.push(...generateBarShapes(chart, layout, scales, true));
      break;
    case "column":
      shapes.push(...generateBarShapes(chart, layout, scales, false));
      break;
    case "line":
      shapes.push(...generateLineShapes(chart, layout, scales));
      break;
    case "waterfall":
      shapes.push(...generateWaterfallShapes(chart, layout, scales));
      shapes.push(...generateWaterfallLabels(chart, layout, scales));
      break;
    default:
      shapes.push(...generateBarShapes(chart, layout, scales, false));
  }

  // Category labels
  shapes.push(...generateCategoryLabels(chart, layout, scales));

  // Legend
  if (layout.legend) {
    shapes.push(...generateLegend(chart, layout));
  }

  return shapes;
}

/**
 * Generate all shape descriptors for a chart with label configuration
 */
export function generateShapeDescriptorsWithLabels(
  chart: VectorChart,
  layout: ChartLayout,
  scales: ChartScales,
  labelConfig: LabelConfig
): ShapeDescriptor[] {
  const shapes = generateShapeDescriptors(chart, layout, scales);

  // Add data labels if enabled
  if (labelConfig.showLabels) {
    shapes.push(...generateDataLabels(chart, layout, scales, labelConfig));
  }

  return shapes;
}

/**
 * Render options including labels, annotations, and theme
 */
export interface RenderOptions {
  labelConfig?: LabelConfig;
  annotations?: SimpleAnnotation[];
  themeId?: string;
}

/**
 * Generate all shape descriptors with full options
 */
export function generateShapeDescriptorsWithOptions(
  chart: VectorChart,
  layout: ChartLayout,
  scales: ChartScales,
  options: RenderOptions
): ShapeDescriptor[] {
  // Get theme (from options or chart or default)
  const theme = options.themeId
    ? getThemeById(options.themeId) || getDefaultTheme()
    : chart.themeId
      ? getThemeById(chart.themeId) || getDefaultTheme()
      : getDefaultTheme();

  const shapes = generateShapeDescriptorsWithTheme(chart, layout, scales, theme);

  // Add data labels if enabled
  if (options.labelConfig?.showLabels) {
    shapes.push(...generateDataLabels(chart, layout, scales, options.labelConfig));
  }

  // Add annotations
  if (options.annotations && options.annotations.length > 0) {
    shapes.push(...generateAnnotationShapes(chart, layout, scales, options.annotations));
  }

  return shapes;
}

/**
 * Generate shape descriptors with theme applied
 */
function generateShapeDescriptorsWithTheme(
  chart: VectorChart,
  layout: ChartLayout,
  scales: ChartScales,
  theme: VectorTheme
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];

  // Background with theme colors
  shapes.push({
    id: `${chart.id}_bg`,
    type: "rectangle",
    left: layout.outer.left,
    top: layout.outer.top,
    width: layout.outer.width,
    height: layout.outer.height,
    fill: theme.colors.background,
    stroke: theme.styles.showChartBorder ? theme.colors.axis : theme.colors.background,
    strokeWidth: theme.styles.showChartBorder ? 1 : 0,
    chartId: chart.id,
    layer: "background",
  });

  // Title
  if (layout.title) {
    const titleText = getTitleForChartType(chart.type);
    shapes.push({
      id: `${chart.id}_title`,
      type: "textbox",
      ...layout.title,
      text: titleText,
      fontSize: theme.fonts.titleSize,
      fontBold: true,
      textAlign: "center",
      layer: "label",
    });
  }

  // Axes (with theme grid settings)
  shapes.push(...generateAxisShapes(chart, layout, scales, {
    showGridLines: theme.styles.showGridLines,
    gridLineColor: theme.colors.axis,
    axisLineColor: theme.colors.axis,
    tickLabelFontSize: theme.fonts.tickSize,
  }));

  // Generate data shapes based on chart type with theme colors
  switch (chart.type) {
    case "bar":
      shapes.push(...generateThemedBarShapes(chart, layout, scales, theme, true));
      break;
    case "column":
      shapes.push(...generateThemedBarShapes(chart, layout, scales, theme, false));
      break;
    case "line":
      shapes.push(...generateThemedLineShapes(chart, layout, scales, theme));
      break;
    case "waterfall":
      shapes.push(...generateWaterfallShapes(chart, layout, scales, {
        positive: theme.colors.positive,
        negative: theme.colors.negative,
        total: theme.colors.total,
        subtotal: theme.colors.axis,
        connector: theme.colors.axis,
      }));
      shapes.push(...generateWaterfallLabels(chart, layout, scales));
      break;
    default:
      shapes.push(...generateThemedBarShapes(chart, layout, scales, theme, false));
  }

  // Category labels
  shapes.push(...generateCategoryLabels(chart, layout, scales));

  // Legend with theme colors
  if (layout.legend) {
    shapes.push(...generateThemedLegend(chart, layout, theme));
  }

  return shapes;
}

/**
 * Generate themed bar/column chart shapes
 */
function generateThemedBarShapes(
  chart: VectorChart,
  layout: ChartLayout,
  scales: ChartScales,
  theme: VectorTheme,
  horizontal: boolean
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];
  const numSeries = chart.series.length;

  if (horizontal) {
    const groupHeight = layout.plot.height / chart.categories.length;
    const barHeight = (groupHeight * theme.styles.barWidthRatio) / numSeries;
    const yMin = scales.y.domain[0];
    const yMax = scales.y.domain[1];
    const valueRange = yMax - yMin;

    chart.series.forEach((series, seriesIndex) => {
      const color = getSeriesColor(theme, seriesIndex);
      series.dataPoints.forEach((point, catIndex) => {
        const value = point.value ?? 0;
        const barWidth = (value / valueRange) * layout.plot.width * 0.85;

        shapes.push({
          id: `${chart.id}_bar_${seriesIndex}_${catIndex}`,
          type: "rectangle",
          left: layout.plot.left,
          top:
            layout.plot.top +
            catIndex * groupHeight +
            seriesIndex * barHeight +
            groupHeight * ((1 - theme.styles.barWidthRatio) / 2),
          width: Math.max(barWidth, 1),
          height: barHeight - 2,
          fill: color,
          stroke: color,
          elementTag: `bar:${seriesIndex}:${catIndex}`,
          chartId: chart.id,
          layer: "data",
        });
      });
    });
  } else {
    const bandwidth = scales.x.bandwidth;
    const barWidth = (bandwidth * theme.styles.barWidthRatio) / numSeries;
    const zeroY = scales.y.scale(0);

    chart.series.forEach((series, seriesIndex) => {
      const color = getSeriesColor(theme, seriesIndex);
      series.dataPoints.forEach((point, catIndex) => {
        const category = chart.categories[catIndex];
        const value = point.value ?? 0;
        const x = scales.x.scale(category.label) + seriesIndex * barWidth + bandwidth * ((1 - theme.styles.barWidthRatio) / 2);
        const valueY = scales.y.scale(value);
        const barHeight = Math.abs(zeroY - valueY);
        const barTop = value >= 0 ? valueY : zeroY;

        shapes.push({
          id: `${chart.id}_bar_${seriesIndex}_${catIndex}`,
          type: "rectangle",
          left: x,
          top: barTop,
          width: barWidth - 2,
          height: Math.max(barHeight, 1),
          fill: color,
          stroke: color,
          elementTag: `bar:${seriesIndex}:${catIndex}`,
          chartId: chart.id,
          layer: "data",
        });
      });
    });
  }

  return shapes;
}

/**
 * Generate themed line chart shapes
 */
function generateThemedLineShapes(
  chart: VectorChart,
  layout: ChartLayout,
  scales: ChartScales,
  theme: VectorTheme
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];
  const pointSize = theme.styles.pointSize;

  chart.series.forEach((series, seriesIndex) => {
    const color = getSeriesColor(theme, seriesIndex);
    series.dataPoints.forEach((point, catIndex) => {
      const category = chart.categories[catIndex];
      const value = point.value ?? 0;
      const x = scales.x.center(category.label);
      const y = scales.y.scale(value);

      shapes.push({
        id: `${chart.id}_point_${seriesIndex}_${catIndex}`,
        type: "ellipse",
        left: x - pointSize / 2,
        top: y - pointSize / 2,
        width: pointSize,
        height: pointSize,
        fill: color,
        stroke: theme.colors.background,
        strokeWidth: 2,
        elementTag: `point:${seriesIndex}:${catIndex}`,
        chartId: chart.id,
        layer: "data",
      });
    });
  });

  return shapes;
}

/**
 * Generate themed legend shapes
 */
function generateThemedLegend(
  chart: VectorChart,
  layout: ChartLayout,
  theme: VectorTheme
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];
  const legendY = layout.legend?.top ?? layout.outer.top + layout.outer.height - 20;
  const itemWidth = 100;

  chart.series.slice(0, 4).forEach((series, index) => {
    const x = layout.outer.left + index * itemWidth;
    const color = getSeriesColor(theme, index);

    // Color swatch
    shapes.push({
      id: `${chart.id}_legend_swatch_${index}`,
      type: "rectangle",
      left: x,
      top: legendY,
      width: 12,
      height: 12,
      fill: color,
      stroke: color,
      layer: "legend",
    });

    // Label
    shapes.push({
      id: `${chart.id}_legend_label_${index}`,
      type: "textbox",
      left: x + 16,
      top: legendY - 2,
      width: 80,
      height: 16,
      text: series.label,
      fontSize: theme.fonts.labelSize,
      layer: "legend",
    });
  });

  return shapes;
}

/**
 * Generate bar/column chart shapes (legacy, uses default colors)
 */
function generateBarShapes(
  chart: VectorChart,
  layout: ChartLayout,
  scales: ChartScales,
  horizontal: boolean
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];
  const numSeries = chart.series.length;

  if (horizontal) {
    // Horizontal bars
    const groupHeight = layout.plot.height / chart.categories.length;
    const barHeight = (groupHeight * 0.8) / numSeries;
    const yMin = scales.y.domain[0];
    const yMax = scales.y.domain[1];
    const valueRange = yMax - yMin;

    chart.series.forEach((series, seriesIndex) => {
      series.dataPoints.forEach((point, catIndex) => {
        const value = point.value ?? 0;
        const barWidth = (value / valueRange) * layout.plot.width * 0.85;

        shapes.push({
          id: `${chart.id}_bar_${seriesIndex}_${catIndex}`,
          type: "rectangle",
          left: layout.plot.left,
          top:
            layout.plot.top +
            catIndex * groupHeight +
            seriesIndex * barHeight +
            groupHeight * 0.1,
          width: Math.max(barWidth, 1),
          height: barHeight - 2,
          fill: series.colorFill || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length],
          stroke: series.colorBorder || series.colorFill || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length],
          elementTag: `bar:${seriesIndex}:${catIndex}`,
          chartId: chart.id,
          layer: "data",
        });
      });
    });
  } else {
    // Vertical columns
    const bandwidth = scales.x.bandwidth;
    const barWidth = (bandwidth * 0.8) / numSeries;
    const zeroY = scales.y.scale(0);

    chart.series.forEach((series, seriesIndex) => {
      series.dataPoints.forEach((point, catIndex) => {
        const category = chart.categories[catIndex];
        const value = point.value ?? 0;
        const x = scales.x.scale(category.label) + seriesIndex * barWidth + bandwidth * 0.1;
        const valueY = scales.y.scale(value);
        const barHeight = Math.abs(zeroY - valueY);
        const barTop = value >= 0 ? valueY : zeroY;

        shapes.push({
          id: `${chart.id}_bar_${seriesIndex}_${catIndex}`,
          type: "rectangle",
          left: x,
          top: barTop,
          width: barWidth - 2,
          height: Math.max(barHeight, 1),
          fill: series.colorFill || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length],
          stroke: series.colorBorder || series.colorFill || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length],
          elementTag: `bar:${seriesIndex}:${catIndex}`,
          chartId: chart.id,
          layer: "data",
        });
      });
    });
  }

  return shapes;
}

/**
 * Generate line chart shapes
 */
function generateLineShapes(
  chart: VectorChart,
  layout: ChartLayout,
  scales: ChartScales
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];
  const pointSize = 16;

  chart.series.forEach((series, seriesIndex) => {
    series.dataPoints.forEach((point, catIndex) => {
      const category = chart.categories[catIndex];
      const value = point.value ?? 0;
      const x = scales.x.center(category.label);
      const y = scales.y.scale(value);

      shapes.push({
        id: `${chart.id}_point_${seriesIndex}_${catIndex}`,
        type: "ellipse",
        left: x - pointSize / 2,
        top: y - pointSize / 2,
        width: pointSize,
        height: pointSize,
        fill: series.colorFill || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length],
        stroke: "#ffffff",
        strokeWidth: 2,
        elementTag: `point:${seriesIndex}:${catIndex}`,
        chartId: chart.id,
        layer: "data",
      });
    });
  });

  return shapes;
}

/**
 * Generate category labels
 */
function generateCategoryLabels(
  chart: VectorChart,
  layout: ChartLayout,
  scales: ChartScales
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];

  if (chart.type === "bar") {
    // Horizontal bars - labels on the left
    const groupHeight = layout.plot.height / chart.categories.length;

    chart.categories.forEach((category, index) => {
      shapes.push({
        id: `${chart.id}_catlabel_${index}`,
        type: "textbox",
        left: layout.outer.left + 5,
        top: layout.plot.top + index * groupHeight + groupHeight / 2 - 10,
        width: 45,
        height: 20,
        text: category.label,
        fontSize: 9,
        textAlign: "right",
        layer: "label",
      });
    });
  } else {
    // Vertical charts - labels at the bottom
    chart.categories.forEach((category, index) => {
      const x = scales.x.center(category.label);

      shapes.push({
        id: `${chart.id}_catlabel_${index}`,
        type: "textbox",
        left: x - 25,
        top: layout.plot.top + layout.plot.height + 5,
        width: 50,
        height: 20,
        text: category.label,
        fontSize: 9,
        textAlign: "center",
        layer: "label",
      });
    });
  }

  return shapes;
}

/**
 * Generate legend shapes
 */
function generateLegend(
  chart: VectorChart,
  layout: ChartLayout
): ShapeDescriptor[] {
  const shapes: ShapeDescriptor[] = [];
  const legendY = layout.legend?.top ?? layout.outer.top + layout.outer.height - 20;
  const itemWidth = 100;

  chart.series.slice(0, 4).forEach((series, index) => {
    const x = layout.outer.left + index * itemWidth;

    // Color swatch
    shapes.push({
      id: `${chart.id}_legend_swatch_${index}`,
      type: "rectangle",
      left: x,
      top: legendY,
      width: 12,
      height: 12,
      fill: series.colorFill || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      stroke: series.colorFill || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      layer: "legend",
    });

    // Label
    shapes.push({
      id: `${chart.id}_legend_label_${index}`,
      type: "textbox",
      left: x + 16,
      top: legendY - 2,
      width: 80,
      height: 16,
      text: series.label,
      fontSize: 9,
      layer: "legend",
    });
  });

  return shapes;
}

/**
 * Get title for chart type
 */
function getTitleForChartType(type: string): string {
  switch (type) {
    case "bar":
      return "Bar Chart";
    case "column":
      return "Column Chart";
    case "line":
      return "Line Chart";
    case "pie":
      return "Pie Chart";
    case "area":
      return "Area Chart";
    case "waterfall":
      return "Waterfall Chart";
    default:
      return "Chart";
  }
}

// ============================================================================
// PowerPoint Shape Creation
// ============================================================================

/**
 * Create PowerPoint shapes from descriptors
 */
export async function applyShapesToSlide(
  shapes: PowerPoint.ShapeCollection,
  descriptors: ShapeDescriptor[],
  chartId: string
): Promise<RenderResult> {
  const result: RenderResult = {
    backgroundShape: null,
    shapes: new Map(),
  };

  // Sort by layer to ensure correct z-order
  const layerOrder = ["background", "axis", "data", "label", "legend"];
  const sorted = [...descriptors].sort(
    (a, b) => layerOrder.indexOf(a.layer) - layerOrder.indexOf(b.layer)
  );

  for (const desc of sorted) {
    let shape: PowerPoint.Shape;

    switch (desc.type) {
      case "rectangle":
        shape = shapes.addGeometricShape(
          PowerPoint.GeometricShapeType.rectangle,
          {
            left: desc.left,
            top: desc.top,
            width: desc.width,
            height: desc.height,
          }
        );
        if (desc.fill) shape.fill.setSolidColor(desc.fill);
        if (desc.stroke) shape.lineFormat.color = desc.stroke;
        if (desc.strokeWidth) shape.lineFormat.weight = desc.strokeWidth;
        break;

      case "ellipse":
        shape = shapes.addGeometricShape(
          PowerPoint.GeometricShapeType.ellipse,
          {
            left: desc.left,
            top: desc.top,
            width: desc.width,
            height: desc.height,
          }
        );
        if (desc.fill) shape.fill.setSolidColor(desc.fill);
        if (desc.stroke) shape.lineFormat.color = desc.stroke;
        if (desc.strokeWidth) shape.lineFormat.weight = desc.strokeWidth;
        break;

      case "textbox":
        shape = shapes.addTextBox(desc.text || "", {
          left: desc.left,
          top: desc.top,
          width: desc.width,
          height: desc.height,
        });
        if (desc.fontSize) shape.textFrame.textRange.font.size = desc.fontSize;
        if (desc.fontBold) shape.textFrame.textRange.font.bold = desc.fontBold;
        if (desc.textAlign) {
          const alignment =
            desc.textAlign === "center"
              ? PowerPoint.ParagraphHorizontalAlignment.center
              : desc.textAlign === "right"
                ? PowerPoint.ParagraphHorizontalAlignment.right
                : PowerPoint.ParagraphHorizontalAlignment.left;
          shape.textFrame.textRange.paragraphFormat.horizontalAlignment = alignment;
        }
        break;

      default:
        continue;
    }

    // Tag shapes for identification
    if (desc.chartId) {
      shape.tags.add("VECTOR_CHART_ID", desc.chartId);
    }
    if (desc.elementTag) {
      shape.tags.add("VECTOR_ELEMENT", desc.elementTag);
    }

    // Track background shape
    if (desc.layer === "background") {
      result.backgroundShape = shape;
    }

    result.shapes.set(desc.id, shape);
  }

  return result;
}

// ============================================================================
// High-Level Render Function
// ============================================================================

/**
 * Render a VectorChart to a PowerPoint slide
 */
export async function renderChart(
  shapes: PowerPoint.ShapeCollection,
  chart: VectorChart,
  labelConfig?: LabelConfig
): Promise<RenderResult> {
  // Calculate layout
  const layout = calculateLayout(chart.dimensions, {
    showTitle: true,
    showLegend: true,
  });

  // Calculate scales
  const scales = calculateScales(chart, layout);

  // Generate shape descriptors (with or without labels)
  const descriptors = labelConfig
    ? generateShapeDescriptorsWithLabels(chart, layout, scales, labelConfig)
    : generateShapeDescriptors(chart, layout, scales);

  // Apply to PowerPoint
  return applyShapesToSlide(shapes, descriptors, chart.id);
}

/**
 * Render a VectorChart with full options (labels + annotations)
 */
export async function renderChartWithOptions(
  shapes: PowerPoint.ShapeCollection,
  chart: VectorChart,
  options: RenderOptions
): Promise<RenderResult> {
  // Calculate layout
  const layout = calculateLayout(chart.dimensions, {
    showTitle: true,
    showLegend: true,
  });

  // Calculate scales
  const scales = calculateScales(chart, layout);

  // Generate shape descriptors with options
  const descriptors = generateShapeDescriptorsWithOptions(chart, layout, scales, options);

  // Apply to PowerPoint
  return applyShapesToSlide(shapes, descriptors, chart.id);
}

// Re-export label config types
export type { LabelConfig } from "./labelPlacement";
export { defaultLabelConfig } from "./labelPlacement";

// Re-export annotation types
export type { SimpleAnnotation, AnnotationConfig } from "./annotations";
export { createValueLineAnnotation, createDiffArrowAnnotation } from "./annotations";
