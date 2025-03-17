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

type CombinedDataPoint = Record<string, any>;

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
    relatedConfig: Omit<Config, 'description' | 'takeaway'> & { description?: string };
}) {
    // Determine whether we need dual axes based on value ranges
    const mainValues = mainData.map(item => Number(item[mainConfig.yKeys[0]])).filter(val => !isNaN(val));
    const relatedValues = relatedData.map(item => Number(item[relatedConfig.yKeys[0]])).filter(val => !isNaN(val));

    const mainMax = Math.max(...mainValues);
    const relatedMax = Math.max(...relatedValues);

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
        const dataPoint: CombinedDataPoint = { xValue };

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

    // Sort data if x axis is numeric
    const isNumericXAxis = !isNaN(Number(combinedData[0]?.xValue));
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

    // For bar charts, use grouped bars
    if (mainConfig.type === "bar") {
        const mainYKey = mainConfig.yKeys[0];
        const relatedYKey = relatedConfig.yKeys[0];

        return (
            <ChartContainer config={chartColorConfig}>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={combinedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="xValue" />
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
                        <XAxis dataKey="xValue" />
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
                        <Line
                            name={`${toTitleCase(mainYKey)} (${mainConfig.title})`}
                            type="monotone"
                            dataKey={mainPrefix + mainYKey}
                            stroke="#8884d8"
                            yAxisId="left"
                            activeDot={{ r: 8 }}
                        />
                        <Line
                            name={`${toTitleCase(relatedYKey)} (${relatedConfig.title})`}
                            type="monotone"
                            dataKey={relatedPrefix + relatedYKey}
                            stroke="#82ca9d"
                            yAxisId={needsDualAxes ? "right" : "left"}
                            activeDot={{ r: 8 }}
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