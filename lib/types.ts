import { z } from "zod";

export type Unicorn = {
  id: number;
  company: string;
  valuation: number;
  date_joined: Date | null;
  country: string;
  city: string;
  industry: string;
  select_investors: string;
  continent: string;
  twitter: string;
  url: string;
  year_founded: number;
  month_founded: number;
  day_founded: number;
  round: string;
  investors: string;
  growth_rate: number;
};

export type Result = Record<string, any>;

// New types for multi-query support
export type SqlQuery = {
  queryName: string;
  queryDescription: string;
  sql: string;
};

export type QueryResult = {
  queryName: string;
  queryDescription: string;
  data: Result[];
};

// Updated explanation schema for multi-query support
export const explanationSchema = z.object({
  section: z.string(),
  explanation: z.string(),
});

export const queryExplanationSchema = z.object({
  queryName: z.string(),
  sections: z.array(explanationSchema),
  overallPurpose: z.string()
});

export const explanationsSchema = z.array(queryExplanationSchema);

export type QueryExplanation = z.infer<typeof explanationSchema>;
export type QueryFullExplanation = z.infer<typeof queryExplanationSchema>;

// Define the schema for chart configuration
export const configSchema = z
  .object({
    description: z
      .string()
      .describe(
        "Describe the chart. What is it showing? What is interesting about the way the data is displayed?",
      ),
    takeaway: z.string().describe("What is the main takeaway from the chart?"),
    type: z.enum(["bar", "line", "area", "pie", "scatter", "radar", "polar", "gauge", "heatmap", "treemap", "table"]).describe("Type of chart"),
    title: z.string(),
    xKey: z.string().describe("Key for x-axis or category"),
    yKeys: z.array(z.string()).describe("Key(s) for y-axis values this is typically the quantitative column"),
    multipleLines: z.boolean().describe("For line charts only: whether the chart is comparing groups of data.").optional(),
    measurementColumn: z.string().describe("For line charts only: key for quantitative y-axis column to measure against (eg. values, counts etc.)").optional(),
    lineCategories: z.array(z.string()).describe("For line charts only: Categories used to compare different lines or data series. Each category represents a distinct line in the chart.").optional(),
    colors: z
      .record(
        z.string().describe("Any of the yKeys"),
        z.string().describe("Color value in CSS format (e.g., hex, rgb, hsl)"),
      )
      .describe("Mapping of data keys to color values for chart elements")
      .optional(),
    legend: z.boolean().describe("Whether to show legend"),
    // For multiple charts in a dashboard
    relatedCharts: z.array(
      z.object({
        queryName: z.string().describe("Name of the query this chart represents"),
        description: z.string().describe("Description of what this specific chart shows"),
        type: z.enum(["bar", "line", "area", "pie", "scatter", "radar", "polar", "gauge", "heatmap", "treemap", "table"]),
        title: z.string(),
        xKey: z.string(),
        yKeys: z.array(z.string()),
        legend: z.boolean().optional()
      })
    ).optional().describe("Additional charts to display alongside the main chart")
  })
  .describe("Chart configuration object");


export type Config = z.infer<typeof configSchema>;

// Define the Insights type for data analysis
export type Insights = {
  summary: string;
  keyFindings: Array<{
    title: string;
    description: string;
    importance: "high" | "medium" | "low";
  }>;
  recommendedActions: string[];
  anomalies?: Array<{
    description: string;
    possibleExplanations: string[];
  }>;
  correlations?: Array<{
    variables: string[];
    relationship: string;
    strength: "strong" | "moderate" | "weak";
  }>;
  trends?: Array<{
    variable: string;
    description: string;
    direction: "increasing" | "decreasing" | "fluctuating" | "stable";
  }>;
};
