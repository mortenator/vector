/* global PowerPoint */

import { ChartData, ChartType } from "../types/chartData";
import {
  VectorChart,
  VectorChartType,
  createVectorChart,
  DEFAULT_COLORS,
} from "../types/vectorChart";
import {
  saveChartDataToShape,
  saveChartToSettings,
  saveChartPersistent,
  tagShapeWithChartId,
} from "./dataStorage";
import {
  renderChart,
  renderChartWithOptions,
  RenderResult,
  LabelConfig,
  RenderOptions,
} from "../rendering/pipeline";

// Re-export ChartType for backwards compatibility
export type { ChartType } from "../types/chartData";
export type { VectorChartType } from "../types/vectorChart";

/**
 * Inserts a chart into the current PowerPoint slide
 * Uses Office.js APIs to create shapes that represent chart elements
 */
export async function insertChart(
  chartType: ChartType,
  data: ChartData
): Promise<void> {
  return PowerPoint.run(async (context) => {
    // Get the selected slide
    const slides = context.presentation.slides;
    slides.load("items");
    await context.sync();

    if (slides.items.length === 0) {
      throw new Error("No slides in presentation");
    }

    // Get the first selected slide or the first slide
    const slide = slides.items[0];
    const shapes = slide.shapes;

    // Chart dimensions and position (in points)
    const chartLeft = 100;
    const chartTop = 150;
    const chartWidth = 500;
    const chartHeight = 300;

    // Create chart based on type
    let backgroundShape: PowerPoint.Shape | null = null;

    switch (chartType) {
      case "bar":
      case "column":
        backgroundShape = await createBarChart(
          shapes,
          chartLeft,
          chartTop,
          chartWidth,
          chartHeight,
          data,
          chartType === "bar"
        );
        break;
      case "line":
        backgroundShape = await createLineChartVisualization(
          shapes,
          chartLeft,
          chartTop,
          chartWidth,
          chartHeight,
          data
        );
        break;
      case "pie":
        backgroundShape = await createPieChartVisualization(
          shapes,
          chartLeft,
          chartTop,
          chartWidth,
          chartHeight,
          data
        );
        break;
    }

    // Save chart data to shape tags and settings
    if (backgroundShape) {
      await saveChartDataToShape(backgroundShape, data);
    }
    await saveChartToSettings(data);

    await context.sync();
  });
}

async function createBarChart(
  shapes: PowerPoint.ShapeCollection,
  left: number,
  top: number,
  width: number,
  height: number,
  data: ChartData,
  horizontal: boolean
): Promise<PowerPoint.Shape> {
  const barColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const maxValue = Math.max(...data.series.flatMap((s) => s.values));
  const numCategories = data.categories.length;
  const numSeries = data.series.length;

  // Create chart background
  const background = shapes.addGeometricShape(
    PowerPoint.GeometricShapeType.rectangle,
    {
      left,
      top,
      width,
      height,
    }
  );
  background.fill.setSolidColor("#f8fafc");
  background.lineFormat.color = "#e2e8f0";

  if (horizontal) {
    // Horizontal bar chart
    const groupHeight = (height - 40) / numCategories;
    const barHeight = (groupHeight * 0.8) / numSeries;

    for (let i = 0; i < numCategories; i++) {
      for (let s = 0; s < numSeries; s++) {
        const value = data.series[s].values[i] || 0;
        const barLength = (value / maxValue) * (width * 0.75);

        const bar = shapes.addGeometricShape(
          PowerPoint.GeometricShapeType.rectangle,
          {
            left: left + 60,
            top: top + 20 + i * groupHeight + s * barHeight,
            width: barLength,
            height: barHeight - 2,
          }
        );
        bar.fill.setSolidColor(barColors[s % barColors.length]);
        bar.lineFormat.color = barColors[s % barColors.length];
      }

      // Category label
      const label = shapes.addTextBox(data.categories[i], {
        left: left + 5,
        top: top + 20 + i * groupHeight + (groupHeight * 0.8) / 2 - 10,
        width: 50,
        height: 20,
      });
      label.textFrame.textRange.font.size = 9;
    }
  } else {
    // Vertical bar (column) chart
    const groupWidth = (width - 60) / numCategories;
    const barWidth = (groupWidth * 0.8) / numSeries;

    for (let i = 0; i < numCategories; i++) {
      for (let s = 0; s < numSeries; s++) {
        const value = data.series[s].values[i] || 0;
        const barHeight = (value / maxValue) * (height * 0.75);

        const bar = shapes.addGeometricShape(
          PowerPoint.GeometricShapeType.rectangle,
          {
            left: left + 40 + i * groupWidth + s * barWidth,
            top: top + height - barHeight - 30,
            width: barWidth - 2,
            height: barHeight,
          }
        );
        bar.fill.setSolidColor(barColors[s % barColors.length]);
        bar.lineFormat.color = barColors[s % barColors.length];
      }

      // Category label
      const label = shapes.addTextBox(data.categories[i], {
        left: left + 40 + i * groupWidth,
        top: top + height - 25,
        width: groupWidth,
        height: 20,
      });
      label.textFrame.textRange.font.size = 9;
      label.textFrame.textRange.paragraphFormat.horizontalAlignment =
        PowerPoint.ParagraphHorizontalAlignment.center;
    }
  }

  // Add title
  const title = shapes.addTextBox(
    horizontal ? "Bar Chart" : "Column Chart",
    {
      left: left + width / 2 - 50,
      top: top - 30,
      width: 100,
      height: 25,
    }
  );
  title.textFrame.textRange.font.bold = true;
  title.textFrame.textRange.font.size = 14;

  // Add legend
  const legendTop = top + height + 10;
  for (let s = 0; s < Math.min(numSeries, 4); s++) {
    const legendItem = shapes.addGeometricShape(
      PowerPoint.GeometricShapeType.rectangle,
      {
        left: left + s * 100,
        top: legendTop,
        width: 12,
        height: 12,
      }
    );
    legendItem.fill.setSolidColor(barColors[s % barColors.length]);
    legendItem.lineFormat.color = barColors[s % barColors.length];

    const legendLabel = shapes.addTextBox(data.series[s].name, {
      left: left + s * 100 + 16,
      top: legendTop - 2,
      width: 80,
      height: 16,
    });
    legendLabel.textFrame.textRange.font.size = 9;
  }

  return background;
}

async function createLineChartVisualization(
  shapes: PowerPoint.ShapeCollection,
  left: number,
  top: number,
  width: number,
  height: number,
  data: ChartData
): Promise<PowerPoint.Shape> {
  const pointColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  const maxValue = Math.max(...data.series.flatMap((s) => s.values));
  const numPoints = data.categories.length;

  // Create chart background
  const background = shapes.addGeometricShape(
    PowerPoint.GeometricShapeType.rectangle,
    {
      left,
      top,
      width,
      height,
    }
  );
  background.fill.setSolidColor("#f8fafc");
  background.lineFormat.color = "#e2e8f0";

  // Create data points for each series
  for (let s = 0; s < Math.min(data.series.length, 4); s++) {
    const series = data.series[s];
    for (let i = 0; i < series.values.length; i++) {
      const x =
        left + 50 + (i * (width - 100)) / Math.max(numPoints - 1, 1);
      const y =
        top +
        height -
        50 -
        ((series.values[i] || 0) / maxValue) * (height - 100);

      const point = shapes.addGeometricShape(
        PowerPoint.GeometricShapeType.ellipse,
        {
          left: x - 8,
          top: y - 8,
          width: 16,
          height: 16,
        }
      );
      point.fill.setSolidColor(pointColors[s % pointColors.length]);
      point.lineFormat.color = "#ffffff";
      point.lineFormat.weight = 2;
    }
  }

  // Add category labels on x-axis
  for (let i = 0; i < numPoints; i++) {
    const x = left + 50 + (i * (width - 100)) / Math.max(numPoints - 1, 1);
    const label = shapes.addTextBox(data.categories[i], {
      left: x - 25,
      top: top + height - 25,
      width: 50,
      height: 20,
    });
    label.textFrame.textRange.font.size = 9;
    label.textFrame.textRange.paragraphFormat.horizontalAlignment =
      PowerPoint.ParagraphHorizontalAlignment.center;
  }

  // Add title
  const title = shapes.addTextBox("Line Chart", {
    left: left + width / 2 - 50,
    top: top - 30,
    width: 100,
    height: 25,
  });
  title.textFrame.textRange.font.bold = true;
  title.textFrame.textRange.font.size = 14;

  // Add legend
  const legendTop = top + height + 10;
  for (let s = 0; s < Math.min(data.series.length, 4); s++) {
    const legendItem = shapes.addGeometricShape(
      PowerPoint.GeometricShapeType.ellipse,
      {
        left: left + s * 100,
        top: legendTop,
        width: 12,
        height: 12,
      }
    );
    legendItem.fill.setSolidColor(pointColors[s % pointColors.length]);
    legendItem.lineFormat.color = "#ffffff";

    const legendLabel = shapes.addTextBox(data.series[s].name, {
      left: left + s * 100 + 16,
      top: legendTop - 2,
      width: 80,
      height: 16,
    });
    legendLabel.textFrame.textRange.font.size = 9;
  }

  return background;
}

async function createPieChartVisualization(
  shapes: PowerPoint.ShapeCollection,
  left: number,
  top: number,
  width: number,
  height: number,
  data: ChartData
): Promise<PowerPoint.Shape> {
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const radius = Math.min(width, height) / 2 - 40;

  const sliceColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  // Use first series values for pie chart
  const values = data.series[0]?.values || [1, 1, 1, 1];
  const total = values.reduce((sum, v) => sum + v, 0);

  // Create background circle with first color
  const circle = shapes.addGeometricShape(
    PowerPoint.GeometricShapeType.ellipse,
    {
      left: centerX - radius,
      top: centerY - radius,
      width: radius * 2,
      height: radius * 2,
    }
  );
  circle.fill.setSolidColor(sliceColors[0]);
  circle.lineFormat.color = "#ffffff";
  circle.lineFormat.weight = 2;

  // Create pie slices using partial shapes (simplified)
  if (values.length >= 2) {
    const slice1 = shapes.addGeometricShape(
      PowerPoint.GeometricShapeType.pie,
      {
        left: centerX - radius,
        top: centerY - radius,
        width: radius * 2,
        height: radius * 2,
      }
    );
    slice1.fill.setSolidColor(sliceColors[1]);
    slice1.lineFormat.color = "#ffffff";
  }

  if (values.length >= 3) {
    const slice2 = shapes.addGeometricShape(
      PowerPoint.GeometricShapeType.chord,
      {
        left: centerX - radius + 10,
        top: centerY - radius + 10,
        width: radius * 2 - 20,
        height: radius * 2 - 20,
      }
    );
    slice2.fill.setSolidColor(sliceColors[2]);
    slice2.lineFormat.color = "#ffffff";
  }

  // Add title
  const title = shapes.addTextBox("Pie Chart", {
    left: left + width / 2 - 50,
    top: top - 30,
    width: 100,
    height: 25,
  });
  title.textFrame.textRange.font.bold = true;
  title.textFrame.textRange.font.size = 14;

  // Add legend with category labels
  const legendTop = top + height + 10;
  const numLegendItems = Math.min(data.categories.length, 4);
  for (let i = 0; i < numLegendItems; i++) {
    const legendItem = shapes.addGeometricShape(
      PowerPoint.GeometricShapeType.rectangle,
      {
        left: left + i * 120,
        top: legendTop,
        width: 12,
        height: 12,
      }
    );
    legendItem.fill.setSolidColor(sliceColors[i % sliceColors.length]);
    legendItem.lineFormat.color = sliceColors[i % sliceColors.length];

    const legendLabel = shapes.addTextBox(
      `${data.categories[i]}: ${values[i]}`,
      {
        left: left + i * 120 + 16,
        top: legendTop - 2,
        width: 100,
        height: 16,
      }
    );
    legendLabel.textFrame.textRange.font.size = 9;
  }

  return circle;
}

/**
 * Get information about the current selection
 */
export async function getSelectionInfo(): Promise<string> {
  return PowerPoint.run(async (context) => {
    const selection = context.presentation.getSelectedSlides();
    selection.load("items");
    await context.sync();

    return `Selected ${selection.items.length} slide(s)`;
  });
}

// ============================================================================
// NEW: VectorChart-based rendering (Phase 2)
// ============================================================================

/**
 * Convert legacy ChartData to VectorChart
 */
export function chartDataToVectorChart(
  data: ChartData,
  type?: VectorChartType
): VectorChart {
  const chartType: VectorChartType =
    type || (data.type as VectorChartType) || "column";

  // Build the data array for createVectorChart
  const dataArray: (string | number | null)[][] = [];

  // Header row with categories
  dataArray.push([null, ...data.categories]);

  // Data rows with series
  data.series.forEach((series) => {
    dataArray.push([series.name, ...series.values]);
  });

  const chart = createVectorChart(chartType, dataArray);

  // Preserve the original ID
  chart.id = data.id;

  return chart;
}

/**
 * Convert VectorChart back to legacy ChartData
 */
export function vectorChartToChartData(chart: VectorChart): ChartData {
  return {
    id: chart.id,
    type: chart.type as ChartType,
    categories: chart.categories.map((c) => c.label),
    series: chart.series.map((s) => ({
      name: s.label,
      values: s.dataPoints.map((p) => p.value ?? 0),
    })),
  };
}

/**
 * Insert a VectorChart using the new rendering pipeline
 */
export async function insertVectorChart(chart: VectorChart): Promise<void> {
  return PowerPoint.run(async (context) => {
    const slides = context.presentation.slides;
    slides.load("items");
    await context.sync();

    if (slides.items.length === 0) {
      throw new Error("No slides in presentation");
    }

    const slide = slides.items[0];
    const shapes = slide.shapes;

    // Render using new pipeline
    const result: RenderResult = await renderChart(shapes, chart);

    // Tag the background shape with chart ID
    if (result.backgroundShape) {
      await tagShapeWithChartId(result.backgroundShape, chart.id);
    }

    // Persist chart data
    await saveChartPersistent(vectorChartToChartData(chart));

    await context.sync();
  });
}

/**
 * Insert chart using new pipeline (backward compatible wrapper)
 */
export async function insertChartV2(
  chartType: ChartType,
  data: ChartData
): Promise<void> {
  const vectorChart = chartDataToVectorChart(data, chartType as VectorChartType);
  return insertVectorChart(vectorChart);
}

/**
 * Insert a VectorChart with label configuration
 */
export async function insertVectorChartWithLabels(
  chart: VectorChart,
  labelConfig?: LabelConfig
): Promise<void> {
  return PowerPoint.run(async (context) => {
    const slides = context.presentation.slides;
    slides.load("items");
    await context.sync();

    if (slides.items.length === 0) {
      throw new Error("No slides in presentation");
    }

    const slide = slides.items[0];
    const shapes = slide.shapes;

    // Render using new pipeline with labels
    const result: RenderResult = await renderChart(shapes, chart, labelConfig);

    // Tag the background shape with chart ID
    if (result.backgroundShape) {
      await tagShapeWithChartId(result.backgroundShape, chart.id);
    }

    // Persist chart data
    await saveChartPersistent(vectorChartToChartData(chart));

    await context.sync();
  });
}

/**
 * Insert a VectorChart with full render options (labels + annotations)
 */
export async function insertVectorChartWithOptions(
  chart: VectorChart,
  options: RenderOptions
): Promise<void> {
  return PowerPoint.run(async (context) => {
    const slides = context.presentation.slides;
    slides.load("items");
    await context.sync();

    if (slides.items.length === 0) {
      throw new Error("No slides in presentation");
    }

    const slide = slides.items[0];
    const shapes = slide.shapes;

    // Render using new pipeline with full options
    const result: RenderResult = await renderChartWithOptions(shapes, chart, options);

    // Tag the background shape with chart ID
    if (result.backgroundShape) {
      await tagShapeWithChartId(result.backgroundShape, chart.id);
    }

    // Persist chart data
    await saveChartPersistent(vectorChartToChartData(chart));

    await context.sync();
  });
}
