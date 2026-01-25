import React from "react";
import {
  VectorTheme,
  presetThemes,
  getDefaultTheme,
} from "../types/theme";

interface ThemePanelProps {
  selectedThemeId: string | null;
  onChange: (theme: VectorTheme) => void;
}

const ThemePanel: React.FC<ThemePanelProps> = ({
  selectedThemeId,
  onChange,
}) => {
  const currentThemeId = selectedThemeId || getDefaultTheme().id;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-gray-600 mb-2">Color Theme</h3>

      <div className="grid grid-cols-2 gap-2">
        {presetThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={theme.id === currentThemeId}
            onSelect={() => onChange(theme)}
          />
        ))}
      </div>
    </div>
  );
};

interface ThemeCardProps {
  theme: VectorTheme;
  isSelected: boolean;
  onSelect: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      onClick={onSelect}
      className={`
        p-2 rounded-lg border-2 transition-all text-left
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-sm"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        }
      `}
    >
      {/* Theme preview - color swatches */}
      <div className="flex gap-0.5 mb-2">
        {theme.colors.series.slice(0, 5).map((color, index) => (
          <div
            key={index}
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Theme name */}
      <div className="text-xs font-medium text-gray-700">{theme.name}</div>

      {/* Theme description */}
      <div className="text-[10px] text-gray-500 line-clamp-1">
        {theme.description}
      </div>
    </button>
  );
};

/**
 * Compact theme selector for inline use
 */
interface ThemeSelectorProps {
  selectedThemeId: string | null;
  onChange: (themeId: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedThemeId,
  onChange,
}) => {
  const currentThemeId = selectedThemeId || getDefaultTheme().id;
  const currentTheme = presetThemes.find((t) => t.id === currentThemeId) || getDefaultTheme();

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-600">Theme:</label>
      <div className="relative flex-1">
        <select
          value={currentThemeId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-2 pr-8 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
        >
          {presetThemes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Preview swatches */}
      <div className="flex gap-0.5">
        {currentTheme.colors.series.slice(0, 4).map((color, index) => (
          <div
            key={index}
            className="w-3 h-3 rounded-sm border border-gray-200"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};

export default ThemePanel;
