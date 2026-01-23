import React, { useCallback } from "react";
import { ChartData, ChartSeries } from "../types/chartData";

interface DataGridProps {
  data: ChartData;
  onChange: (data: ChartData) => void;
}

const DataGrid: React.FC<DataGridProps> = ({ data, onChange }) => {
  const handleCategoryChange = useCallback(
    (index: number, value: string) => {
      const newCategories = [...data.categories];
      newCategories[index] = value;
      onChange({ ...data, categories: newCategories });
    },
    [data, onChange]
  );

  const handleSeriesNameChange = useCallback(
    (seriesIndex: number, value: string) => {
      const newSeries = data.series.map((s, i) =>
        i === seriesIndex ? { ...s, name: value } : s
      );
      onChange({ ...data, series: newSeries });
    },
    [data, onChange]
  );

  const handleValueChange = useCallback(
    (seriesIndex: number, valueIndex: number, value: string) => {
      const numValue = parseFloat(value) || 0;
      const newSeries = data.series.map((s, i) => {
        if (i === seriesIndex) {
          const newValues = [...s.values];
          newValues[valueIndex] = numValue;
          return { ...s, values: newValues };
        }
        return s;
      });
      onChange({ ...data, series: newSeries });
    },
    [data, onChange]
  );

  const addColumn = useCallback(() => {
    const newCategories = [...data.categories, `Col${data.categories.length + 1}`];
    const newSeries = data.series.map((s) => ({
      ...s,
      values: [...s.values, 0],
    }));
    onChange({ ...data, categories: newCategories, series: newSeries });
  }, [data, onChange]);

  const removeColumn = useCallback(
    (index: number) => {
      if (data.categories.length <= 1) return;
      const newCategories = data.categories.filter((_, i) => i !== index);
      const newSeries = data.series.map((s) => ({
        ...s,
        values: s.values.filter((_, i) => i !== index),
      }));
      onChange({ ...data, categories: newCategories, series: newSeries });
    },
    [data, onChange]
  );

  const addRow = useCallback(() => {
    const newSeries: ChartSeries = {
      name: `Series${data.series.length + 1}`,
      values: new Array(data.categories.length).fill(0),
    };
    onChange({ ...data, series: [...data.series, newSeries] });
  }, [data, onChange]);

  const removeRow = useCallback(
    (index: number) => {
      if (data.series.length <= 1) return;
      const newSeries = data.series.filter((_, i) => i !== index);
      onChange({ ...data, series: newSeries });
    },
    [data, onChange]
  );

  const handleFileImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, {
          header: 1,
        });

        if (jsonData.length < 2 || !jsonData[0] || jsonData[0].length < 2) {
          alert("Excel file must have at least 2 columns and 2 rows");
          return;
        }

        // First row is categories (skip first cell which is empty or label)
        const categories = jsonData[0].slice(1).map(String);

        // Remaining rows are series
        const series: ChartSeries[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.length > 0) {
            series.push({
              name: String(row[0] || `Series${i}`),
              values: row.slice(1).map((v) => parseFloat(String(v)) || 0),
            });
          }
        }

        onChange({
          ...data,
          categories,
          series: series.length > 0 ? series : data.series,
        });
      } catch (error) {
        console.error("Error importing Excel file:", error);
        alert("Failed to import Excel file. Please check the format.");
      }

      // Reset file input
      event.target.value = "";
    },
    [data, onChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Chart Data</h3>
        <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Import Excel
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileImport}
            className="hidden"
          />
        </label>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-1 border-b border-r border-gray-200 w-16"></th>
              {data.categories.map((cat, i) => (
                <th
                  key={i}
                  className="p-1 border-b border-r border-gray-200 min-w-[60px]"
                >
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={cat}
                      onChange={(e) => handleCategoryChange(i, e.target.value)}
                      className="w-full px-1 py-0.5 text-center border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded text-xs font-medium"
                    />
                    {data.categories.length > 1 && (
                      <button
                        onClick={() => removeColumn(i)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                        title="Remove column"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="p-1 border-b border-gray-200 w-8">
                <button
                  onClick={addColumn}
                  className="text-gray-400 hover:text-blue-500"
                  title="Add column"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.series.map((series, si) => (
              <tr key={si} className="hover:bg-gray-50">
                <td className="p-1 border-r border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={series.name}
                      onChange={(e) => handleSeriesNameChange(si, e.target.value)}
                      className="w-full px-1 py-0.5 border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded text-xs font-medium"
                    />
                    {data.series.length > 1 && (
                      <button
                        onClick={() => removeRow(si)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                        title="Remove row"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
                {series.values.map((val, vi) => (
                  <td key={vi} className="p-1 border-r border-gray-200">
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => handleValueChange(si, vi, e.target.value)}
                      className="w-full px-1 py-0.5 text-center border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded text-xs"
                    />
                  </td>
                ))}
                <td className="p-1"></td>
              </tr>
            ))}
            <tr>
              <td className="p-1 border-r border-gray-200 bg-gray-50">
                <button
                  onClick={addRow}
                  className="text-gray-400 hover:text-blue-500 w-full flex justify-center"
                  title="Add row"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </td>
              <td
                colSpan={data.categories.length + 1}
                className="p-1"
              ></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataGrid;
