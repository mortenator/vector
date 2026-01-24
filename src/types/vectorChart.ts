/**
 * VectorChart Type Definitions
 *
 * Based on the Think-cell-inspired ERD from Vector Architecture.pdf.
 * This data model enables:
 * - Document-persistent state via CustomXmlParts/Settings
 * - Edit-after-insertion via hydration cycle
 * - Smart annotations and labels
 * - Excel data linking
 */

// ============================================================================
// Core Chart Types
// ============================================================================

export type VectorChartType =
  | "bar"
  | "column"
  | "line"
  | "area"
  | "pie"
  | "waterfall"
  | "mekko"
  | "combo";

export interface Dimensions {
  width: number;
  height: number;
  left: number;
  top: number;
}

/**
 * Root chart entity - the entry point for all chart data
 */
export interface VectorChart {
  /** UUID linked to PowerPoint shape group via VECTOR_CHART_ID tag */
  id: string;
  /** Chart type */
  type: VectorChartType;
  /** Schema version for migration support */
  version: number;
  /** Bounding box dimensions */
  dimensions: Dimensions;
  /** Optional theme reference */
  themeId: string | null;
  /** Transposed state (categories become series) */
  isFlipped: boolean;
  /** The data backing this chart */
  datasheet: Datasheet;
  /** Series definitions derived from datasheet */
  series: Series[];
  /** Category definitions derived from datasheet */
  categories: Category[];
  /** Axis configurations */
  axes: Axis[];
  /** Annotations (arrows, lines, etc.) */
  annotations: Annotation[];
  /** Smart labels */
  labels: SmartLabel[];
}

// ============================================================================
// Data Layer
// ============================================================================

/**
 * Internal grid representation of chart data
 */
export interface Datasheet {
  rowCount: number;
  colCount: number;
  /** If true, first row contains category labels */
  firstRowIsLabel: boolean;
  /** If true, first column contains series labels */
  firstColIsLabel: boolean;
  /** 2D grid of cells */
  cells: DataCell[][];
  /** Optional link to Excel source */
  excelLink: ExcelLink | null;
}

/**
 * Individual cell in the datasheet
 */
export interface DataCell {
  id: string;
  rowIndex: number;
  colIndex: number;
  /** Raw value as entered (string or number) */
  valueRaw: string | number | null;
  /** Parsed numeric value for calculations */
  valueNumeric: number | null;
  /** Optional formula (for future Excel-like support) */
  formula: string | null;
  /** Number format string (e.g., "#,##0", "0.0%") */
  numberFormat: string;
  /** Hidden cells are excluded from rendering */
  isHidden: boolean;
}

/**
 * Link to external Excel data source
 */
export interface ExcelLink {
  id: string;
  /** File path (local) or SharePoint URL */
  filePath: string;
  /** Excel range address (e.g., "Sheet1!A1:D5") */
  rangeAddress: string;
  /** Last update timestamp */
  lastUpdated: string;
  /** Hash of data values for change detection */
  rangeHash: string;
}

// ============================================================================
// Logical Structure (Mapped from Datasheet)
// ============================================================================

/**
 * A data series in the chart
 */
export interface Series {
  id: string;
  /** Display label */
  label: string;
  /** Order index */
  index: number;
  /** Fill color (hex) */
  colorFill: string;
  /** Border color (hex) */
  colorBorder: string;
  /** If true, plotted on secondary Y axis */
  isSecondaryAxis: boolean;
  /** Data points in this series */
  dataPoints: DataPoint[];
}

/**
 * A category (column) in the chart
 */
export interface Category {
  id: string;
  /** Display label */
  label: string;
  /** Order index */
  index: number;
  /** If true, this is a total/subtotal column (for waterfall) */
  isTotal: boolean;
}

/**
 * Individual data point at intersection of series and category
 */
export interface DataPoint {
  id: string;
  /** Reference to the series */
  seriesId: string;
  /** Reference to the category */
  categoryId: string;
  /** The data value */
  value: number | null;
  /** Calculated absolute height in chart coordinates */
  absoluteHeight: number;
  /** Calculated Y start position (for stacked charts) */
  yStart: number;
  /** Reference back to the source DataCell */
  cellRefId: string | null;
}

// ============================================================================
// Axes & Scaling
// ============================================================================

export type AxisType = "value" | "category" | "date";
export type AxisOrientation = "x" | "y" | "y2";
export type ScaleType = "linear" | "log";
export type CrossingBehavior = "atCategory" | "betweenCategory";

/**
 * Axis configuration
 */
export interface Axis {
  id: string;
  type: AxisType;
  orientation: AxisOrientation;
  scaleType: ScaleType;
  /** Minimum value (null = auto) */
  minValue: number | null;
  /** Maximum value (null = auto) */
  maxValue: number | null;
  /** Reverse the axis direction */
  isReversed: boolean;
  /** Where the axis crosses the perpendicular axis */
  crossingBehavior: CrossingBehavior;
  /** Date format string for date axes */
  dateFormat: string | null;
  /** Axis breaks for discontinuous scales */
  breaks: AxisBreak[];
  /** Grid line configuration */
  gridLines: GridLine[];
}

/**
 * Axis break for collapsing coordinate space
 */
export interface AxisBreak {
  id: string;
  startValue: number;
  endValue: number;
  style: "wiggle" | "straight";
}

/**
 * Grid line configuration
 */
export interface GridLine {
  id: string;
  value: number;
  style: "solid" | "dashed" | "dotted";
  color: string;
  width: number;
}

// ============================================================================
// Annotations
// ============================================================================

export type AnnotationType = "diffArrow" | "cagr" | "valueLine" | "connector";
export type AnnotationSubtype = "level" | "total" | "segment";
export type AnchorType = "top" | "bottom" | "center" | "left" | "right";

/**
 * Annotation (arrows, lines, connectors)
 */
export interface Annotation {
  id: string;
  type: AnnotationType;
  subtype: AnnotationSubtype | null;
  /** Override the auto-calculated label text */
  labelTextOverride: string | null;
  /** If true, value is auto-calculated from anchors */
  autoCalc: boolean;
  /** Style properties */
  style: AnnotationStyle;
  /** Anchor points */
  anchors: Anchor[];
}

/**
 * Style properties for annotations
 */
export interface AnnotationStyle {
  color: string;
  lineWidth: number;
  arrowHead: "none" | "arrow" | "dot";
}

/**
 * Anchor point connecting annotation to chart element
 */
export interface Anchor {
  id: string;
  /** Reference to DataPoint, Category, or Axis value */
  targetRefId: string;
  /** What part of the target to anchor to */
  anchorType: AnchorType;
}

// ============================================================================
// Smart Labels
// ============================================================================

export type LabelContentMode = "auto" | "custom" | "field";

/**
 * Smart label with dynamic content
 */
export interface SmartLabel {
  id: string;
  /** Reference to the element this label is for */
  targetRefId: string;
  /** How content is determined */
  contentMode: LabelContentMode;
  /** For field mode: template with tokens like {value}, {series} */
  contentMask: string | null;
  /** Custom static text (for custom mode) */
  customText: string | null;
  /** Rotation in degrees (0, 90, -90) */
  rotation: number;
  /** Manual position offset from default */
  positionOffset: { x: number; y: number };
  /** Font styling */
  fontStyle: FontStyle;
  /** Visibility */
  isVisible: boolean;
}

/**
 * Font style configuration
 */
export interface FontStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  color: string;
}

// ============================================================================
// Factory Functions
// ============================================================================

let idCounter = 0;

/**
 * Generate a unique ID
 */
export function generateVectorId(): string {
  return `v_${Date.now()}_${++idCounter}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Create a default DataCell
 */
export function createDataCell(
  rowIndex: number,
  colIndex: number,
  value: string | number | null = null
): DataCell {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseFloat(value) || null
        : null;

  return {
    id: generateVectorId(),
    rowIndex,
    colIndex,
    valueRaw: value,
    valueNumeric: numericValue,
    formula: null,
    numberFormat: "#,##0",
    isHidden: false,
  };
}

/**
 * Create a default Datasheet from a 2D array of values
 */
export function createDatasheet(
  values: (string | number | null)[][],
  firstRowIsLabel: boolean = true,
  firstColIsLabel: boolean = true
): Datasheet {
  const rowCount = values.length;
  const colCount = values[0]?.length || 0;

  const cells: DataCell[][] = values.map((row, rowIndex) =>
    row.map((value, colIndex) => createDataCell(rowIndex, colIndex, value))
  );

  return {
    rowCount,
    colCount,
    firstRowIsLabel,
    firstColIsLabel,
    cells,
    excelLink: null,
  };
}

/**
 * Create a default Series
 */
export function createSeries(
  label: string,
  index: number,
  color: string = "#3b82f6"
): Series {
  return {
    id: generateVectorId(),
    label,
    index,
    colorFill: color,
    colorBorder: color,
    isSecondaryAxis: false,
    dataPoints: [],
  };
}

/**
 * Create a default Category
 */
export function createCategory(
  label: string,
  index: number,
  isTotal: boolean = false
): Category {
  return {
    id: generateVectorId(),
    label,
    index,
    isTotal,
  };
}

/**
 * Create a default Axis
 */
export function createAxis(
  type: AxisType,
  orientation: AxisOrientation
): Axis {
  return {
    id: generateVectorId(),
    type,
    orientation,
    scaleType: "linear",
    minValue: null,
    maxValue: null,
    isReversed: false,
    crossingBehavior: "betweenCategory",
    dateFormat: null,
    breaks: [],
    gridLines: [],
  };
}

/**
 * Create a default VectorChart
 */
export function createVectorChart(
  type: VectorChartType = "column",
  data?: (string | number | null)[][]
): VectorChart {
  const defaultData = data || [
    [null, "Q1", "Q2", "Q3", "Q4"],
    ["2023", 120, 150, 180, 210],
    ["2024", 140, 170, 200, 250],
  ];

  const datasheet = createDatasheet(defaultData, true, true);

  // Extract categories from first row (skip first cell which is empty)
  const categories: Category[] = defaultData[0]
    .slice(1)
    .map((label, index) =>
      createCategory(String(label || `Cat ${index + 1}`), index)
    );

  // Extract series from subsequent rows
  const defaultColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const series: Series[] = defaultData.slice(1).map((row, seriesIndex) => {
    const seriesObj = createSeries(
      String(row[0] || `Series ${seriesIndex + 1}`),
      seriesIndex,
      defaultColors[seriesIndex % defaultColors.length]
    );

    // Create data points for this series
    seriesObj.dataPoints = row.slice(1).map((value, catIndex) => ({
      id: generateVectorId(),
      seriesId: seriesObj.id,
      categoryId: categories[catIndex].id,
      value: typeof value === "number" ? value : parseFloat(String(value)) || null,
      absoluteHeight: 0, // Calculated during render
      yStart: 0, // Calculated during render
      cellRefId: datasheet.cells[seriesIndex + 1]?.[catIndex + 1]?.id || null,
    }));

    return seriesObj;
  });

  // Create default axes
  const axes: Axis[] = [
    createAxis("category", "x"),
    createAxis("value", "y"),
  ];

  return {
    id: generateVectorId(),
    type,
    version: 1,
    dimensions: { width: 500, height: 300, left: 100, top: 100 },
    themeId: null,
    isFlipped: false,
    datasheet,
    series,
    categories,
    axes,
    annotations: [],
    labels: [],
  };
}

/**
 * Default color palette
 */
export const DEFAULT_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
];

/**
 * Current schema version
 */
export const VECTOR_CHART_VERSION = 1;
