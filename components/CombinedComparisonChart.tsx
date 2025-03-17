"use client";

import {
    Bar,
    BarChart,
    Line,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { Config, Result } from "@/lib/types";

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

    if (diffInDays < 1) {
        // For timestamps within the same day, show hours:minutes
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
        // For timestamps within a week, show weekday
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (diffInDays < 31) {
        // For timestamps within a month, show month/day
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else if (diffInDays < 365) {
        // For timestamps within a year, show month only
        return date.toLocaleDateString(undefined, { month: 'short' });
    } else {
        // For timestamps over a year old, show month and year
        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }
}

type CombinedDataPoint = Record<string, any>;

// Define a more flexible type for the related chart config
type RelatedChartConfig = {
    queryName: string;
    description?: string;
    type: "bar" | "line" | "area" | "pie" | "scatter" | "radar" | "polar" | "gauge" | "heatmap" | "treemap" | "table";
    title: string;
    xKey: string;
    yKeys: string[];
    legend?: boolean;
    takeaway?: string;
};

// Main component to display two datasets on one chart
export function CombinedComparisonChart({
    mainData,
    mainConfig,
    relatedData,
    relatedConfig,
}: {
    mainData: Result[];
    mainConfig: Config;
    relatedData: Result[];
    relatedConfig: RelatedChartConfig;
}) {
    // Check for empty datasets
    if (!mainData || !relatedData || mainData.length === 0 || relatedData.length === 0) {
        return (
            <div className="p-4 border rounded-md bg-muted/20 text-center">
                <p>Not enough data available for comparison chart.</p>
                <p className="text-sm text-muted-foreground mt-2">Try selecting different queries to compare.</p>
            </div>
        );
    }

    // Determine whether we need dual axes based on value ranges
    const mainValues = mainData.map(item => Number(item[mainConfig.yKeys[0]])).filter(val => !isNaN(val));
    const relatedValues = relatedData.map(item => Number(item[relatedConfig.yKeys[0]])).filter(val => !isNaN(val));

    const mainMax = Math.max(...mainValues, 1); // Prevent divide by zero
    const relatedMax = Math.max(...relatedValues, 1); // Prevent divide by zero

    const valueDifference = Math.abs(mainMax - relatedMax) / Math.max(mainMax, relatedMax);
    const needsDualAxes = valueDifference > 0.5; // If difference is more than 50%, use dual axes

    // Combine data for the same chart
    // We need to align the x values from both datasets
    const combinedData: CombinedDataPoint[] = [];

    // Get all unique x values from both datasets
    const allXValues = new Set([
        ...mainData.map(item => String(item[mainConfig.xKey])),
        ...relatedData.map(item => String(item[relatedConfig.xKey]))
    ]);

    // Create the combined dataset with normalized prefixes for each series
    const mainPrefix = "main_";
    const relatedPrefix = "related_";

    Array.from(allXValues).forEach(xValue => {
        const dataPoint: CombinedDataPoint = {
            xValue,
            originalXValue: xValue // Keep the original value for reference
        };

        // Find matching points from each dataset
        const mainItem = mainData.find(item => String(item[mainConfig.xKey]) === xValue);
        const relatedItem = relatedData.find(item => String(item[relatedConfig.xKey]) === xValue);

        // Add main series data
        mainConfig.yKeys.forEach(key => {
            dataPoint[mainPrefix + key] = mainItem ? mainItem[key] : null;
        });

        // Add related series data
        relatedConfig.yKeys.forEach(key => {
            dataPoint[relatedPrefix + key] = relatedItem ? relatedItem[key] : null;
        });

        combinedData.push(dataPoint);
    });

    // Skip empty datasets
    if (combinedData.length === 0) {
        return (
            <div className="p-4 border rounded-md bg-muted/20 text-center">
                <p>No data available for comparison chart.</p>
                <p className="text-sm text-muted-foreground mt-2">Try selecting different queries to compare.</p>
            </div>
        );
    }

    // Sort data if x axis is numeric
    const isNumericXAxis = combinedData.length > 0 && !isNaN(Number(combinedData[0]?.xValue));
    if (isNumericXAxis) {
        combinedData.sort((a, b) => Number(a.xValue) - Number(b.xValue));
    }

    // Create a chart config for styling
    const chartColorConfig: ChartConfig = {
        [mainPrefix + mainConfig.yKeys[0]]: {
            label: `${toTitleCase(mainConfig.yKeys[0])} (${mainConfig.title})`,
            color: "#8884d8"
        },
        [relatedPrefix + relatedConfig.yKeys[0]]: {
            label: `${toTitleCase(relatedConfig.yKeys[0])} (${relatedConfig.title})`,
            color: "#82ca9d"
        }
    };

    // Determine if we're likely dealing with date data
    const isDateData = (
        mainConfig.xKey.toLowerCase().includes('date') ||
        mainConfig.xKey.toLowerCase().includes('time') ||
        mainConfig.xKey.toLowerCase().includes('day') ||
        mainConfig.xKey.toLowerCase().includes('month') ||
        mainConfig.xKey.toLowerCase().includes('year')
    );

    // For bar charts, use grouped bars
    if (mainConfig.type === "bar") {
        const mainYKey = mainConfig.yKeys[0];
        const relatedYKey = relatedConfig.yKeys[0];

        return (
            <ChartContainer config={chartColorConfig}>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={combinedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="xValue"
                            tickFormatter={(value) => isDateData ? formatDateTick(value, 'date') : String(value)}
                        />
                        <YAxis
                            yAxisId="left"
                            label={{ value: toTitleCase(mainYKey), angle: -90, position: 'insideLeft' }}
                        />
                        {needsDualAxes && (
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                label={{ value: toTitleCase(relatedYKey), angle: 90, position: 'insideRight' }}
                            />
                        )}
                        <Tooltip />
                        <Legend />
                        <Bar
                            name={`${toTitleCase(mainYKey)} (${mainConfig.title})`}
                            dataKey={mainPrefix + mainYKey}
                            fill="#8884d8"
                            yAxisId="left"
                        />
                        <Bar
                            name={`${toTitleCase(relatedYKey)} (${relatedConfig.title})`}
                            dataKey={relatedPrefix + relatedYKey}
                            fill="#82ca9d"
                            yAxisId={needsDualAxes ? "right" : "left"}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        );
    }

    // For line charts
    if (mainConfig.type === "line") {
        const mainYKey = mainConfig.yKeys[0];
        const relatedYKey = relatedConfig.yKeys[0];

        return (
            <ChartContainer config={chartColorConfig}>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={combinedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="xValue"
                            tickFormatter={(value) => isDateData ? formatDateTick(value, 'date') : String(value)}
                        />
                        <YAxis
                            yAxisId="left"
                            label={{ value: toTitleCase(mainYKey), angle: -90, position: 'insideLeft' }}
                        />
                        {needsDualAxes && (
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                label={{ value: toTitleCase(relatedYKey), angle: 90, position: 'insideRight' }}
                            />
                        )}
                        <Tooltip
                            formatter={(value, name) => {
                                const nameStr = String(name);
                                if (nameStr.startsWith(mainPrefix)) {
                                    return [value, `${toTitleCase(mainYKey)} (${mainConfig.title})`];
                                } else if (nameStr.startsWith(relatedPrefix)) {
                                    return [value, `${toTitleCase(relatedYKey)} (${relatedConfig.title})`];
                                }
                                return [value, name];
                            }}
                            labelFormatter={(label) => isDateData ? formatDateTick(label, 'date') : String(label)}
                        />
                        <Legend />
                        <Line
                            name={`${toTitleCase(mainYKey)} (${mainConfig.title})`}
                            type="monotone"
                            dataKey={mainPrefix + mainYKey}
                            stroke="#8884d8"
                            yAxisId="left"
                            activeDot={{ r: 8 }}
                            connectNulls={true}
                        />
                        <Line
                            name={`${toTitleCase(relatedYKey)} (${relatedConfig.title})`}
                            type="monotone"
                            dataKey={relatedPrefix + relatedYKey}
                            stroke="#82ca9d"
                            yAxisId={needsDualAxes ? "right" : "left"}
                            activeDot={{ r: 8 }}
                            connectNulls={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        );
    }

    // Fallback - if chart type is not supported for combined view
    return (
        <div className="p-4 border rounded-md bg-muted/20">
            <p>Combined view is not available for this chart type.</p>
            <p className="text-sm text-muted-foreground">Try using the side-by-side view instead.</p>
        </div>
    );
} 