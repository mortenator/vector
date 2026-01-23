/* global Office, PowerPoint */

export type ChartType = "bar" | "column" | "line" | "pie";

interface ChartData {
  categories: string[];
  series: { name: string; values: number[] }[];
}

// Sample data for demonstration
const sampleData: ChartData = {
  categories: ["Q1", "Q2", "Q3", "Q4"],
  series: [
    { name: "2023", values: [120, 150, 180, 210] },
    { name: "2024", values: [140, 170, 200, 250] },
  ],
};

/**
 * Inserts a chart into the current PowerPoint slide
 * Uses Office.js APIs to create shapes that represent chart elements
 */
export async function insertChart(chartType: ChartType): Promise<void> {
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
    switch (chartType) {
      case "bar":
      case "column":
        await createBarChart(shapes, chartLeft, chartTop, chartWidth, chartHeight, sampleData, chartType === "bar");
        break;
      case "line":
        await createLineChartVisualization(shapes, chartLeft, chartTop, chartWidth, chartHeight, sampleData);
        break;
      case "pie":
        await createPieChartVisualization(shapes, chartLeft, chartTop, chartWidth, chartHeight);
        break;
    }

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
): Promise<void> {
  const barColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  const barWidth = horizontal ? height / (data.categories.length * 2) : width / (data.categories.length * 2);
  const maxValue = Math.max(...data.series.flatMap(s => s.values));

  // Create chart background
  const background = shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle, {
    left,
    top,
    width,
    height,
  });
  background.fill.setSolidColor("#f8fafc");
  background.lineFormat.color = "#e2e8f0";

  // Create bars for each data point
  for (let i = 0; i < data.categories.length; i++) {
    const value = data.series[0].values[i];
    const barLength = (value / maxValue) * (horizontal ? width * 0.8 : height * 0.8);

    if (horizontal) {
      // Horizontal bar
      const bar = shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle, {
        left: left + 20,
        top: top + 20 + i * (barWidth + 15),
        width: barLength,
        height: barWidth,
      });
      bar.fill.setSolidColor(barColors[i % barColors.length]);
      bar.lineFormat.color = barColors[i % barColors.length];
    } else {
      // Vertical bar (column)
      const bar = shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle, {
        left: left + 40 + i * (barWidth + 30),
        top: top + height - barLength - 20,
        width: barWidth,
        height: barLength,
      });
      bar.fill.setSolidColor(barColors[i % barColors.length]);
      bar.lineFormat.color = barColors[i % barColors.length];
    }
  }

  // Add title
  const title = shapes.addTextBox(horizontal ? "Bar Chart" : "Column Chart", {
    left: left + width / 2 - 50,
    top: top - 30,
    width: 100,
    height: 25,
  });
  title.textFrame.textRange.font.bold = true;
  title.textFrame.textRange.font.size = 14;
}

async function createLineChartVisualization(
  shapes: PowerPoint.ShapeCollection,
  left: number,
  top: number,
  width: number,
  height: number,
  data: ChartData
): Promise<void> {
  // Create chart background
  const background = shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle, {
    left,
    top,
    width,
    height,
  });
  background.fill.setSolidColor("#f8fafc");
  background.lineFormat.color = "#e2e8f0";

  // Create data points as circles
  const maxValue = Math.max(...data.series[0].values);
  const pointColors = ["#3b82f6", "#10b981"];

  for (let s = 0; s < Math.min(data.series.length, 2); s++) {
    const series = data.series[s];
    for (let i = 0; i < series.values.length; i++) {
      const x = left + 50 + (i * (width - 100)) / (series.values.length - 1);
      const y = top + height - 50 - (series.values[i] / maxValue) * (height - 100);

      const point = shapes.addGeometricShape(PowerPoint.GeometricShapeType.ellipse, {
        left: x - 8,
        top: y - 8,
        width: 16,
        height: 16,
      });
      point.fill.setSolidColor(pointColors[s]);
      point.lineFormat.color = "#ffffff";
      point.lineFormat.weight = 2;
    }
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
}

async function createPieChartVisualization(
  shapes: PowerPoint.ShapeCollection,
  left: number,
  top: number,
  width: number,
  height: number
): Promise<void> {
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const radius = Math.min(width, height) / 2 - 40;

  // Create pie segments using ellipse arcs
  const sliceColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  // Create full circle background
  const circle = shapes.addGeometricShape(PowerPoint.GeometricShapeType.ellipse, {
    left: centerX - radius,
    top: centerY - radius,
    width: radius * 2,
    height: radius * 2,
  });
  circle.fill.setSolidColor(sliceColors[0]);
  circle.lineFormat.color = "#ffffff";
  circle.lineFormat.weight = 2;

  // Create pie slices using partial pies (simplified representation)
  const slice1 = shapes.addGeometricShape(PowerPoint.GeometricShapeType.pie, {
    left: centerX - radius,
    top: centerY - radius,
    width: radius * 2,
    height: radius * 2,
  });
  slice1.fill.setSolidColor(sliceColors[1]);
  slice1.lineFormat.color = "#ffffff";

  const slice2 = shapes.addGeometricShape(PowerPoint.GeometricShapeType.chord, {
    left: centerX - radius + 10,
    top: centerY - radius + 10,
    width: radius * 2 - 20,
    height: radius * 2 - 20,
  });
  slice2.fill.setSolidColor(sliceColors[2]);
  slice2.lineFormat.color = "#ffffff";

  // Add title
  const title = shapes.addTextBox("Pie Chart", {
    left: left + width / 2 - 50,
    top: top - 30,
    width: 100,
    height: 25,
  });
  title.textFrame.textRange.font.bold = true;
  title.textFrame.textRange.font.size = 14;
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
