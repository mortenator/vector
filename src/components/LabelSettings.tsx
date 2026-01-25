import React from "react";
import { LabelConfig } from "../rendering/labelPlacement";

interface LabelSettingsProps {
  config: LabelConfig;
  onChange: (config: LabelConfig) => void;
}

const LabelSettings: React.FC<LabelSettingsProps> = ({ config, onChange }) => {
  const handleChange = (updates: Partial<LabelConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-3">
      {/* Show Labels Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-700">Show Data Labels</label>
        <button
          onClick={() => handleChange({ showLabels: !config.showLabels })}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${config.showLabels ? "bg-blue-600" : "bg-gray-300"}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${config.showLabels ? "translate-x-6" : "translate-x-1"}
            `}
          />
        </button>
      </div>

      {/* Additional options (only visible when labels are enabled) */}
      {config.showLabels && (
        <>
          {/* Position */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Label Position
            </label>
            <select
              value={config.position}
              onChange={(e) =>
                handleChange({
                  position: e.target.value as LabelConfig["position"],
                })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
              <option value="center">Center</option>
              <option value="inside">Inside</option>
              <option value="outside">Outside</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Font Size
            </label>
            <select
              value={config.fontSize}
              onChange={(e) =>
                handleChange({ fontSize: parseInt(e.target.value, 10) })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="7">7pt</option>
              <option value="8">8pt</option>
              <option value="9">9pt</option>
              <option value="10">10pt</option>
              <option value="11">11pt</option>
              <option value="12">12pt</option>
            </select>
          </div>

          {/* Decimal Places */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Decimal Places
            </label>
            <select
              value={config.decimals}
              onChange={(e) =>
                handleChange({ decimals: parseInt(e.target.value, 10) })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          {/* Show as Percentage */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showAsPercent"
              checked={config.showAsPercent}
              onChange={(e) =>
                handleChange({ showAsPercent: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showAsPercent" className="text-xs text-gray-600">
              Show as percentage
            </label>
          </div>
        </>
      )}
    </div>
  );
};

export default LabelSettings;
