/**
 * Vector Theme System
 *
 * Provides color palettes and styling presets for charts.
 * Similar to Think-cell's template system.
 */

/**
 * Color palette for chart elements
 */
export interface ColorPalette {
  /** Primary series colors (up to 8) */
  series: string[];
  /** Positive value color (for waterfall) */
  positive: string;
  /** Negative value color (for waterfall) */
  negative: string;
  /** Total/subtotal color (for waterfall) */
  total: string;
  /** Text color */
  text: string;
  /** Axis/grid line color */
  axis: string;
  /** Background color */
  background: string;
  /** Chart area background */
  plotBackground: string;
}

/**
 * Font configuration
 */
export interface ThemeFonts {
  family: string;
  titleSize: number;
  labelSize: number;
  tickSize: number;
}

/**
 * Chart styling options
 */
export interface ThemeStyles {
  /** Bar/column border radius */
  borderRadius: number;
  /** Bar width as percentage of available space */
  barWidthRatio: number;
  /** Line chart line width */
  lineWidth: number;
  /** Point size for line charts */
  pointSize: number;
  /** Show grid lines */
  showGridLines: boolean;
  /** Grid line style */
  gridLineStyle: "solid" | "dashed" | "dotted";
  /** Show chart border */
  showChartBorder: boolean;
}

/**
 * Complete theme definition
 */
export interface VectorTheme {
  id: string;
  name: string;
  description: string;
  colors: ColorPalette;
  fonts: ThemeFonts;
  styles: ThemeStyles;
}

// ============================================================================
// Preset Themes
// ============================================================================

/**
 * Default corporate theme - professional blue palette
 */
export const corporateTheme: VectorTheme = {
  id: "corporate",
  name: "Corporate",
  description: "Professional blue palette for business presentations",
  colors: {
    series: [
      "#1e40af", // Blue 800
      "#3b82f6", // Blue 500
      "#60a5fa", // Blue 400
      "#93c5fd", // Blue 300
      "#1e3a8a", // Blue 900
      "#2563eb", // Blue 600
      "#3b82f6", // Blue 500
      "#60a5fa", // Blue 400
    ],
    positive: "#059669", // Emerald 600
    negative: "#dc2626", // Red 600
    total: "#1e40af", // Blue 800
    text: "#1f2937", // Gray 800
    axis: "#9ca3af", // Gray 400
    background: "#f8fafc", // Slate 50
    plotBackground: "#ffffff",
  },
  fonts: {
    family: "Arial, sans-serif",
    titleSize: 14,
    labelSize: 10,
    tickSize: 9,
  },
  styles: {
    borderRadius: 0,
    barWidthRatio: 0.8,
    lineWidth: 2,
    pointSize: 8,
    showGridLines: true,
    gridLineStyle: "solid",
    showChartBorder: true,
  },
};

/**
 * Colorful theme - vibrant multi-color palette
 */
export const colorfulTheme: VectorTheme = {
  id: "colorful",
  name: "Colorful",
  description: "Vibrant multi-color palette for engaging presentations",
  colors: {
    series: [
      "#3b82f6", // Blue
      "#10b981", // Emerald
      "#f59e0b", // Amber
      "#ef4444", // Red
      "#8b5cf6", // Violet
      "#ec4899", // Pink
      "#06b6d4", // Cyan
      "#84cc16", // Lime
    ],
    positive: "#10b981", // Emerald
    negative: "#ef4444", // Red
    total: "#6366f1", // Indigo
    text: "#111827", // Gray 900
    axis: "#6b7280", // Gray 500
    background: "#ffffff",
    plotBackground: "#fafafa",
  },
  fonts: {
    family: "Segoe UI, Arial, sans-serif",
    titleSize: 14,
    labelSize: 10,
    tickSize: 9,
  },
  styles: {
    borderRadius: 2,
    barWidthRatio: 0.75,
    lineWidth: 3,
    pointSize: 10,
    showGridLines: true,
    gridLineStyle: "dashed",
    showChartBorder: false,
  },
};

/**
 * Monochrome theme - grayscale for formal documents
 */
export const monochromeTheme: VectorTheme = {
  id: "monochrome",
  name: "Monochrome",
  description: "Grayscale palette for formal reports and documents",
  colors: {
    series: [
      "#1f2937", // Gray 800
      "#4b5563", // Gray 600
      "#6b7280", // Gray 500
      "#9ca3af", // Gray 400
      "#d1d5db", // Gray 300
      "#374151", // Gray 700
      "#6b7280", // Gray 500
      "#9ca3af", // Gray 400
    ],
    positive: "#374151", // Gray 700
    negative: "#9ca3af", // Gray 400 (pattern fill would be better)
    total: "#1f2937", // Gray 800
    text: "#111827", // Gray 900
    axis: "#9ca3af", // Gray 400
    background: "#ffffff",
    plotBackground: "#ffffff",
  },
  fonts: {
    family: "Times New Roman, serif",
    titleSize: 14,
    labelSize: 10,
    tickSize: 9,
  },
  styles: {
    borderRadius: 0,
    barWidthRatio: 0.7,
    lineWidth: 2,
    pointSize: 6,
    showGridLines: true,
    gridLineStyle: "dotted",
    showChartBorder: true,
  },
};

/**
 * Dark theme - for dark-mode presentations
 */
export const darkTheme: VectorTheme = {
  id: "dark",
  name: "Dark",
  description: "Dark mode palette for modern presentations",
  colors: {
    series: [
      "#60a5fa", // Blue 400
      "#34d399", // Emerald 400
      "#fbbf24", // Amber 400
      "#f87171", // Red 400
      "#a78bfa", // Violet 400
      "#f472b6", // Pink 400
      "#22d3ee", // Cyan 400
      "#a3e635", // Lime 400
    ],
    positive: "#34d399", // Emerald 400
    negative: "#f87171", // Red 400
    total: "#60a5fa", // Blue 400
    text: "#f3f4f6", // Gray 100
    axis: "#6b7280", // Gray 500
    background: "#111827", // Gray 900
    plotBackground: "#1f2937", // Gray 800
  },
  fonts: {
    family: "Arial, sans-serif",
    titleSize: 14,
    labelSize: 10,
    tickSize: 9,
  },
  styles: {
    borderRadius: 4,
    barWidthRatio: 0.8,
    lineWidth: 3,
    pointSize: 10,
    showGridLines: true,
    gridLineStyle: "solid",
    showChartBorder: false,
  },
};

/**
 * Pastel theme - soft colors
 */
export const pastelTheme: VectorTheme = {
  id: "pastel",
  name: "Pastel",
  description: "Soft pastel colors for gentle visuals",
  colors: {
    series: [
      "#93c5fd", // Blue 300
      "#86efac", // Green 300
      "#fde047", // Yellow 300
      "#fca5a5", // Red 300
      "#c4b5fd", // Violet 300
      "#f9a8d4", // Pink 300
      "#67e8f9", // Cyan 300
      "#bef264", // Lime 300
    ],
    positive: "#86efac", // Green 300
    negative: "#fca5a5", // Red 300
    total: "#93c5fd", // Blue 300
    text: "#374151", // Gray 700
    axis: "#9ca3af", // Gray 400
    background: "#fefce8", // Yellow 50
    plotBackground: "#fffbeb", // Amber 50
  },
  fonts: {
    family: "Georgia, serif",
    titleSize: 14,
    labelSize: 10,
    tickSize: 9,
  },
  styles: {
    borderRadius: 6,
    barWidthRatio: 0.75,
    lineWidth: 3,
    pointSize: 12,
    showGridLines: false,
    gridLineStyle: "solid",
    showChartBorder: false,
  },
};

/**
 * All available preset themes
 */
export const presetThemes: VectorTheme[] = [
  corporateTheme,
  colorfulTheme,
  monochromeTheme,
  darkTheme,
  pastelTheme,
];

/**
 * Get a theme by ID
 */
export function getThemeById(id: string): VectorTheme | undefined {
  return presetThemes.find((t) => t.id === id);
}

/**
 * Get the default theme
 */
export function getDefaultTheme(): VectorTheme {
  return colorfulTheme;
}

/**
 * Apply theme colors to series
 */
export function getSeriesColor(theme: VectorTheme, seriesIndex: number): string {
  return theme.colors.series[seriesIndex % theme.colors.series.length];
}
