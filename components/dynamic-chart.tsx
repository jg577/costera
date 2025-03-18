"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Config, Result, QueryResult } from "@/lib/types";
import { Label } from "recharts";
import { transformDataForMultiLineChart } from "@/lib/rechart-format";
import { consolidateQueryData, generateConsolidatedColorScheme } from "@/lib/data-consolidation";

function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Function to format timestamps in a human-readable way
function formatDateTick(value: any, xKey: string): string {
  // If the value is not a valid timestamp or date string, return as is
  if (!value || (typeof value !== 'number' && isNaN(new Date(value).getTime()))) {
    return String(value);
  }

  // Convert to Date object if it's a timestamp or date string
  const date = typeof value === 'number' ? new Date(value) : new Date(value);

  // Check if the x-axis key contains date-related terms
  const isDateField = xKey?.toLowerCase().includes('date') ||
    xKey?.toLowerCase().includes('time') ||
    xKey?.toLowerCase().includes('day') ||
    xKey?.toLowerCase().includes('month') ||
    xKey?.toLowerCase().includes('year');

  if (!isDateField) {
    return String(value);
  }

  // Format based on the date range and granularity
  const now = new Date();
  const diffInDays = Math.abs(Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));

  // Always include month and year for consistency
  if (diffInDays < 1) {
    // For timestamps within the same day, show hours:minutes with month and year
    return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${date.getFullYear()} ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffInDays < 7) {
    // For timestamps within a week, show weekday with month and year
    return `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    // For all other timestamps, show month and year
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }
}

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

export function DynamicChart({
  chartData,
  chartConfig,
  queryResults,
}: {
  chartData: Result[];
  chartConfig: Config;
  queryResults?: QueryResult[];
}) {
  // If this is a consolidated view and we have queryResults, use the consolidation logic
  const processedData = chartConfig.isConsolidated && queryResults && queryResults.length > 1
    ? consolidateQueryData(queryResults, chartConfig)
    : chartData;

  // Generate custom colors for consolidated data if needed
  const consolidatedColors = chartConfig.isConsolidated && queryResults
    ? generateConsolidatedColorScheme(queryResults, chartConfig)
    : {};

  // Generate chart color config for the ChartContainer
  const chartColorConfig: Record<string, { label: string; color: string }> = {};
  chartConfig.yKeys.forEach((key, index) => {
    chartColorConfig[key] = {
      label: key,
      color: consolidatedColors[key] || colors[index % colors.length],
    };
  });

  // Function to ensure time series data is properly sorted (oldest to newest)
  const ensureChronologicalOrder = (data: Result[], xKey: string): Result[] => {
    // Skip if this isn't a time-based field
    const isTimeField = xKey.toLowerCase().includes('date') ||
      xKey.toLowerCase().includes('time') ||
      xKey.toLowerCase().includes('day') ||
      xKey.toLowerCase().includes('month') ||
      xKey.toLowerCase().includes('year');

    if (!isTimeField || !data.length) return data;

    return [...data].sort((a, b) => {
      // Convert values to dates if they're date strings
      let dateA = a[xKey];
      let dateB = b[xKey];

      // Handle various date formats
      if (typeof dateA === 'string') {
        dateA = new Date(dateA).getTime();
      }
      if (typeof dateB === 'string') {
        dateB = new Date(dateB).getTime();
      }

      // Always sort from older to newer
      if (typeof dateA === 'number' && typeof dateB === 'number') {
        return dateA - dateB;
      }

      // Fallback for non-numeric/non-date values
      return String(a[xKey]).localeCompare(String(b[xKey]));
    });
  };

  // Function to format currency values with dollar signs and commas
  const formatCurrencyValue = (value: number): string => {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const renderChart = () => {
    if (!processedData || !chartConfig) return <div>No chart data</div>;
    const parsedChartData = processedData.map((item) => {
      const parsedItem: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(item)) {
        parsedItem[key] = isNaN(Number(value)) ? value : Number(value);
      }
      return parsedItem;
    });

    // Apply chronological sorting for time-based data
    let chartData = ensureChronologicalOrder(parsedChartData, chartConfig.xKey);

    const processChartData = (data: Result[], chartType: string) => {
      if (chartType === "bar" || chartType === "pie") {
        if (data.length <= 8) {
          return data;
        }

        const subset = data.slice(0, 20);
        return subset;
      }
      return data;
    };

    chartData = processChartData(chartData, chartConfig.type);

    // Get custom chart colors (combining any defined colors with consolidated colors)
    const chartColors = { ...(chartConfig.colors || {}), ...consolidatedColors };

    // Create a getLegendLabel function to handle consolidated data
    const getLegendLabel = (value: string) => {
      // If this is a consolidated view and we have labelFields mapping
      if (chartConfig.isConsolidated &&
        chartConfig.consolidation?.labelFields &&
        chartConfig.consolidation.labelFields[value]) {
        return chartConfig.consolidation.labelFields[value];
      }
      // Otherwise, convert to title case
      return toTitleCase(value);
    };

    // Create a getBarFill function to handle consolidated data
    const getBarFill = (entry: any, index: number, key: string) => {
      // If we have a color mapping for this key, use it
      if (chartColors[key]) {
        return chartColors[key];
      }

      // For consolidated data, try to determine color by source
      if (chartConfig.isConsolidated && entry && entry.__source) {
        const sourceKey = entry.__source;
        if (chartColors[sourceKey]) {
          return chartColors[sourceKey];
        }
      }

      // For prefixed keys in consolidated data
      if (chartConfig.isConsolidated) {
        // Extract the prefix (query name) from the key
        const prefixMatch = key.match(/^([^_]+)_/);
        if (prefixMatch && prefixMatch[1] && chartColors[prefixMatch[1]]) {
          return chartColors[prefixMatch[1]];
        }
      }

      // Default to the color array
      return colors[index % colors.length];
    };

    // Enhanced tooltip formatter for values
    const formatTooltipValue = (value: any, name: string) => {
      // Check if the field might represent money (based on name)
      const isMoney = name.toLowerCase().includes('cost') ||
        name.toLowerCase().includes('price') ||
        name.toLowerCase().includes('revenue') ||
        name.toLowerCase().includes('sales') ||
        name.toLowerCase().includes('pay') ||
        name.toLowerCase().includes('income') ||
        name.toLowerCase().includes('expense') ||
        name.toLowerCase().includes('profit');

      if (isMoney && typeof value === 'number') {
        return [formatCurrencyValue(value), getLegendLabel(name as string)];
      }

      // Default formatting for non-monetary values
      return [value, getLegendLabel(name as string)];
    };

    switch (chartConfig.type) {
      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={chartConfig.xKey}
              tickFormatter={(value) => formatDateTick(value, chartConfig.xKey)}
            >
              <Label
                value={toTitleCase(chartConfig.xKey)}
                offset={0}
                position="insideBottom"
              />
            </XAxis>
            <YAxis>
              <Label
                value={toTitleCase(chartConfig.yKeys[0])}
                angle={-90}
                position="insideLeft"
              />
            </YAxis>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => {
                    const formattedLabel = formatDateTick(label, chartConfig.xKey);
                    return `${toTitleCase(chartConfig.xKey)}: ${formattedLabel}`;
                  }}
                  formatter={(value, name) => {
                    return formatTooltipValue(value, name as string);
                  }}
                />
              }
            />
            {chartConfig.legend && <Legend formatter={getLegendLabel} />}
            {chartConfig.yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                name={key}
                fill={getBarFill(null, index, key)}
                fillOpacity={chartConfig.isConsolidated ? 0.8 : 1}
              />
            ))}
          </BarChart>
        );
      case "line":
        const { data, xAxisField, lineFields } = transformDataForMultiLineChart(
          chartData,
          chartConfig,
        );
        const useTransformedData =
          chartConfig.multipleLines &&
          chartConfig.measurementColumn &&
          chartConfig.yKeys.includes(chartConfig.measurementColumn);

        // Ensure transformed data is also in chronological order
        const sortedTransformedData = useTransformedData
          ? ensureChronologicalOrder(data, xAxisField)
          : chartData;

        return (
          <LineChart data={useTransformedData ? sortedTransformedData : chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={useTransformedData ? chartConfig.xKey : chartConfig.xKey}
              tickFormatter={(value) => formatDateTick(value, chartConfig.xKey)}
            >
              <Label
                value={toTitleCase(
                  useTransformedData ? xAxisField : chartConfig.xKey,
                )}
                offset={0}
                position="insideBottom"
              />
            </XAxis>
            <YAxis>
              <Label
                value={toTitleCase(chartConfig.yKeys[0])}
                angle={-90}
                position="insideLeft"
              />
            </YAxis>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => {
                    const formattedLabel = formatDateTick(label, chartConfig.xKey);
                    return `${toTitleCase(chartConfig.xKey)}: ${formattedLabel}`;
                  }}
                  formatter={(value, name) => {
                    return formatTooltipValue(value, name as string);
                  }}
                />
              }
            />
            {chartConfig.legend && <Legend formatter={getLegendLabel} />}
            {useTransformedData
              ? lineFields.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={getBarFill(null, index, key)}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  connectNulls={true}
                />
              ))
              : chartConfig.yKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={getBarFill(null, index, key)}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  connectNulls={true}
                />
              ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={chartConfig.xKey}
              tickFormatter={(value) => formatDateTick(value, chartConfig.xKey)}
            />
            <YAxis />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => {
                    const formattedLabel = formatDateTick(label, chartConfig.xKey);
                    return `${toTitleCase(chartConfig.xKey)}: ${formattedLabel}`;
                  }}
                  formatter={(value, name) => {
                    return formatTooltipValue(value, name as string);
                  }}
                />
              }
            />
            {chartConfig.legend && <Legend formatter={getLegendLabel} />}
            {chartConfig.yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                fill={getBarFill(null, index, key)}
                stroke={getBarFill(null, index, key)}
                fillOpacity={0.6}
                connectNulls={true}
              />
            ))}
          </AreaChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={chartConfig.yKeys[0]}
              nameKey={chartConfig.xKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarFill(entry, index, chartConfig.yKeys[0])}
                />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    return formatTooltipValue(value, name as string);
                  }}
                />
              }
            />
            {chartConfig.legend && <Legend formatter={getLegendLabel} />}
          </PieChart>
        );
      default:
        return <div>Unsupported chart type: {chartConfig.type}</div>;
    }
  };

  return (
    <ChartContainer config={chartColorConfig}>
      {renderChart()}
    </ChartContainer>
  );
}
