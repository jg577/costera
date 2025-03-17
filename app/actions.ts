"use server";

import { Config, configSchema, explanationsSchema, Result } from "@/lib/types";
import { openai } from "@ai-sdk/openai";
import { sql } from "@vercel/postgres";
import { generateObject } from "ai";
import { z } from "zod";

export const generateQuery = async (input: string) => {
  "use server";
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      system: `You are a SQL (postgres) and data visualization expert. Your job is to help the user write SQL queries to retrieve the data they need. The database contains the following tables and schemas:

      Table: time_entries
      # column_name            data_type                           is_nullable
      1  id                    text                                NO (PRIMARY KEY)
      2  user_id               text                                NO
      3  project_id            text                                NO
      4  task_id               text                                YES
      5  start_time            timestamp without time zone         NO
      6  end_time              timestamp without time zone         NO
      7  duration              integer                             NO
      8  description           text                                YES
      9  billable              boolean                             YES
      10 created_at            timestamp without time zone         NO
      11 updated_at            timestamp without time zone         NO
      12 location              text                                YES
      13 location_code         text                                YES
      14 employee_id           text                                YES
      15 employee_external_id  text                                YES
      16 employee_name         text                                YES
      17 job_id                text                                YES
      18 job_code              text                                YES
      19 auto_clockout         boolean                             YES
      20 total_hours           numeric(10,2)                       YES
      21 unpaid_break_time     numeric(10,2)                       YES
      22 paid_break_time       numeric(10,2)                       YES
      23 payable_hours         numeric(10,2)                       YES
      24 cash_tips_declared    numeric(10,2)                       YES
      25 non_cash_tips         numeric(10,2)                       YES
      26 total_gratuity        numeric(10,2)                       YES
      27 total_tips            numeric(10,2)                       YES
      28 tips_withheld         numeric(10,2)                       YES
      29 wage                  numeric(10,2)                       YES
      30 regular_hours         numeric(10,2)                       YES
      31 overtime_hours        numeric(10,2)                       YES
      32 regular_pay           numeric(10,2)                       YES
      33 overtime_pay          numeric(10,2)                       YES
      34 total_pay             numeric(10,2)                       YES

      Table: item_selection_details
      # column_name            data_type                           is_nullable
      1  id                    text                                NO (PRIMARY KEY)
      2  selection_id          text                                NO
      3  item_id               text                                NO
      4  quantity              numeric(10,2)                       NO
      5  unit_price            numeric(10,2)                       NO
      6  total_price           numeric(10,2)                       NO
      7  notes                 text                                YES
      8  created_at            timestamp without time zone         NO
      9  updated_at            timestamp without time zone         NO
      10 location              text                                YES
      11 order_number          text                                YES
      12 sent_date             timestamp without time zone         YES
      13 check_id              text                                YES
      14 server                text                                YES
      15 table_name            text                                YES
      16 dining_area           text                                YES
      17 service               text                                YES
      18 dining_option         text                                YES
      19 master_id             text                                YES
      20 sku                   text                                YES
      21 plu                   text                                YES
      22 menu_item             text                                YES
      23 menu_subgroups        text                                YES
      24 menu_group            text                                YES
      25 menu                  text                                YES
      26 sales_category        text                                YES
      27 discount              numeric(10,2)                       YES
      28 tax                   numeric(10,2)                       YES
      29 is_void               boolean                             YES
      30 is_deferred           boolean                             YES
      31 is_tax_exempt         boolean                             YES
      32 tax_inclusion_option  text                                YES
      33 dining_option_tax     text                                YES
      34 tab_name              text                                YES

      Table: food_costs
      # column_name            data_type                           is_nullable
      1  id                    text                                NO (PRIMARY KEY)
      2  month                 timestamp without time zone         YES
      3  dist_sku              text                                YES
      4  mfr_sku               text                                YES
      5  manufacturer          text                                YES
      6  item_name             text                                NO
      7  pack                  text                                YES
      8  size                  text                                YES
      9  brand                 text                                YES
      10 unit_type             text                                YES
      11 quantity              numeric(10,2)                       YES
      12 weight                numeric(10,2)                       YES
      13 sales                 numeric(10,2)                       YES
      14 created_at            timestamp without time zone         NO
      15 updated_at            timestamp without time zone         NO

    Only retrieval queries are allowed.

    EVERY QUERY SHOULD RETURN QUANTITATIVE DATA THAT CAN BE PLOTTED ON A CHART! There should always be at least two columns. If the user asks for a single column, return the column and the count of the column.
    
    The time_entries table contains information about employee work shifts, including the employee details, hours worked, wages, and tips.
    The item_selection_details table contains information about food/beverage orders, their prices, and details about the dining experience.
    The food_costs table contains information about food inventory costs, including product details, pricing, and inventory information.
    
    The tables can be joined on relevant fields for cross-table analysis:
    - time_entries and item_selection_details can be joined on location fields for location-based analysis.
    - item_selection_details and food_costs can be joined on product information (like item_name, sku) for cost vs. sales analysis.
    - All three tables can be used together for comprehensive analyses of operations, costs, and sales.

    IMPORTANT: You have two options for generating queries:
    
    1. SINGLE QUERY WITH JOINS: If the user's request can be satisfied with a single query that uses JOIN operations, you may use that approach.
    
    2. MULTIPLE SEPARATE QUERIES: You are encouraged to generate multiple separate SQL queries when appropriate, especially when:
       - The user is asking for multiple distinct metrics or insights
       - Different parts of the analysis require different groupings or time periods
       - The data would be clearer if presented in separate result sets
       - Complex JOINs might make the query inefficient or the results harder to interpret
    
    When providing multiple queries, each query must be a valid SELECT statement and clearly labeled with a comment indicating what it's calculating (e.g., "-- Query 1: Daily sales totals").
    
    For each query or set of queries, ensure that the returned data will be suitable for visualization (charts, graphs, tables).
    
    You are encouraged to retrieve information independently from all tables or a mix of tables when it makes sense for the analysis. Don't limit yourself to querying just one table if the user's request could benefit from cross-table analysis.
    `,
      prompt: `Generate the SQL query or queries necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        queries: z.array(z.object({
          queryName: z.string().describe("A short name describing what this query calculates"),
          queryDescription: z.string().describe("A brief description of what this query does and what insights it provides"),
          sql: z.string().describe("The SQL query to execute")
        }))
      }),
    });
    return result.object.queries;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

export const runGenerateSQLQuery = async (queries: { queryName: string; queryDescription: string; sql: string }[]) => {
  "use server";

  // Array to hold results from all queries
  const allResults: { queryName: string; queryDescription: string; data: any[] }[] = [];

  // Execute each query
  for (const query of queries) {
    // Check if the query is a SELECT statement
    const sqlQuery = query.sql;
    const sqlLower = sqlQuery.trim().toLowerCase();

    // Check if it starts with SELECT
    if (!sqlLower.startsWith("select")) {
      throw new Error("Only SELECT queries are allowed");
    }

    // Check for disallowed SQL commands using word boundaries or spaces
    const disallowedCommands = [
      /\bdrop\b/,
      /\bdelete\b/,
      /\binsert\b/,
      /\bupdate\b/,
      /\balter\b/,
      /\btruncate\b/,
      /\bcreate\b/,
      /\bgrant\b/,
      /\brevoke\b/
    ];

    if (disallowedCommands.some(pattern => pattern.test(sqlLower))) {
      throw new Error("Only SELECT queries are allowed");
    }

    try {
      const data = await sql.query(sqlQuery);
      allResults.push({
        queryName: query.queryName,
        queryDescription: query.queryDescription,
        data: data.rows
      });
    } catch (e: any) {
      if (e.message.includes('relation "unicorns" does not exist')) {
        console.log(
          "Table does not exist, creating and seeding it with dummy data now...",
        );
        // throw error
        throw Error("Table does not exist");
      } else {
        throw e;
      }
    }
  }

  return allResults;
};

export const explainQuery = async (input: string, queries: { queryName: string; queryDescription: string; sql: string }[]) => {
  "use server";
  try {
    // Format queries for the prompt
    const queriesText = queries.map((q, i) =>
      `Query ${i + 1} (${q.queryName}):\n${q.sql}`
    ).join('\n\n');

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        explanations: z.array(z.object({
          queryName: z.string(),
          sections: z.array(z.object({
            section: z.string(),
            explanation: z.string(),
          })),
          overallPurpose: z.string().describe("A summary of what this query accomplishes")
        }))
      }),
      system: `You are a SQL (postgres) expert. Your job is to explain to the user the SQL queries you wrote to retrieve the data they asked for. The database contains the following tables and schemas:
      
      Table: time_entries
      # column_name            data_type                           is_nullable
      1  id                    text                                NO (PRIMARY KEY)
      2  user_id               text                                NO
      3  project_id            text                                NO
      4  task_id               text                                YES
      5  start_time            timestamp without time zone         NO
      6  end_time              timestamp without time zone         NO
      7  duration              integer                             NO
      8  description           text                                YES
      9  billable              boolean                             YES
      10 created_at            timestamp without time zone         NO
      11 updated_at            timestamp without time zone         NO
      12 location              text                                YES
      13 location_code         text                                YES
      14 employee_id           text                                YES
      15 employee_external_id  text                                YES
      16 employee_name         text                                YES
      17 job_id                text                                YES
      18 job_code              text                                YES
      19 auto_clockout         boolean                             YES
      20 total_hours           numeric(10,2)                       YES
      21 unpaid_break_time     numeric(10,2)                       YES
      22 paid_break_time       numeric(10,2)                       YES
      23 payable_hours         numeric(10,2)                       YES
      24 cash_tips_declared    numeric(10,2)                       YES
      25 non_cash_tips         numeric(10,2)                       YES
      26 total_gratuity        numeric(10,2)                       YES
      27 total_tips            numeric(10,2)                       YES
      28 tips_withheld         numeric(10,2)                       YES
      29 wage                  numeric(10,2)                       YES
      30 regular_hours         numeric(10,2)                       YES
      31 overtime_hours        numeric(10,2)                       YES
      32 regular_pay           numeric(10,2)                       YES
      33 overtime_pay          numeric(10,2)                       YES
      34 total_pay             numeric(10,2)                       YES

      Table: item_selection_details
      # column_name            data_type                           is_nullable
      1  id                    text                                NO (PRIMARY KEY)
      2  selection_id          text                                NO
      3  item_id               text                                NO
      4  quantity              numeric(10,2)                       NO
      5  unit_price            numeric(10,2)                       NO
      6  total_price           numeric(10,2)                       NO
      7  notes                 text                                YES
      8  created_at            timestamp without time zone         NO
      9  updated_at            timestamp without time zone         NO
      10 location              text                                YES
      11 order_number          text                                YES
      12 sent_date             timestamp without time zone         YES
      13 check_id              text                                YES
      14 server                text                                YES
      15 table_name            text                                YES
      16 dining_area           text                                YES
      17 service               text                                YES
      18 dining_option         text                                YES
      19 master_id             text                                YES
      20 sku                   text                                YES
      21 plu                   text                                YES
      22 menu_item             text                                YES
      23 menu_subgroups        text                                YES
      24 menu_group            text                                YES
      25 menu                  text                                YES
      26 sales_category        text                                YES
      27 discount              numeric(10,2)                       YES
      28 tax                   numeric(10,2)                       YES
      29 is_void               boolean                             YES
      30 is_deferred           boolean                             YES
      31 is_tax_exempt         boolean                             YES
      32 tax_inclusion_option  text                                YES
      33 dining_option_tax     text                                YES
      34 tab_name              text                                YES

      Table: food_costs
      # column_name            data_type                           is_nullable
      1  id                    text                                NO (PRIMARY KEY)
      2  month                 timestamp without time zone         YES
      3  dist_sku              text                                YES
      4  mfr_sku               text                                YES
      5  manufacturer          text                                YES
      6  item_name             text                                NO
      7  pack                  text                                YES
      8  size                  text                                YES
      9  brand                 text                                YES
      10 unit_type             text                                YES
      11 quantity              numeric(10,2)                       YES
      12 weight                numeric(10,2)                       YES
      13 sales                 numeric(10,2)                       YES
      14 created_at            timestamp without time zone         NO
      15 updated_at            timestamp without time zone         NO

    When you explain you must take a section of the query, and then explain it. Each "section" should be unique. So in a query like: "SELECT * FROM time_entries limit 20", the sections could be "SELECT *", "FROM time_entries", "LIMIT 20".
    If a section doesnt have any explanation, include it, but leave the explanation empty.

    The time_entries table contains information about employee work shifts, including the employee details, hours worked, wages, and tips.
    The item_selection_details table contains information about food/beverage orders, their prices, and details about the dining experience.
    The food_costs table contains information about food inventory costs, including product details, pricing, and inventory information.

    When explaining JOIN operations, be clear about why the joins were necessary based on the user's query - explain how the tables are related in the context of the query and what business question required pulling data from multiple tables. Make sure to explain join conditions in a way that's accessible to non-technical users.
    
    For multiple queries, explain each query separately and also explain how the queries work together to provide the overall insights the user requested. If queries retrieve data from different tables or combine data from multiple tables, explain why this approach was chosen and how it helps answer the user's question.
    `,
      prompt: `Explain the SQL queries you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down each query into steps. Be concise.

      User Query:
      ${input}

      Generated SQL Queries:
      ${queriesText}`,
    });
    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to explain query");
  }
};

export const generateChartConfig = async (
  queryResults: { queryName: string; queryDescription: string; data: any[] }[],
  userQuery: string,
) => {
  "use server";
  try {
    // Format the query results for the prompt
    const formattedResults = queryResults.map((qr, i) => {
      const sampleData = qr.data.slice(0, 5); // Take first 5 rows as sample
      return `Query ${i + 1} (${qr.queryName}): ${qr.queryDescription}\nSample data (${qr.data.length} total rows):\n${JSON.stringify(sampleData, null, 2)}`;
    }).join('\n\n');

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: configSchema,
      system: `You are a data visualization expert. Your job is to help users create charts that best represent their data.
      First, you need to suggest the most suitable chart type(s) for visualizing the data returned by the SQL queries.
      Then, provide a complete configuration for the chart.

      The data comes from a restaurant management system with these main tables:
      - time_entries: Contains employee work shift data, hours, wages, and tips
      - item_selection_details: Contains food/beverage orders, prices, and dining details
      - food_costs: Contains inventory costs, product details, and sales information

      Chart Options:
      - 'line' - Line Chart (good for time series or continuous data)
      - 'bar' - Bar Chart (good for comparing categorical data)
      - 'pie' - Pie Chart (good for showing proportions of a whole)
      - 'scatter' - Scatter Plot (good for showing correlation between two variables)
      - 'area' - Area Chart (good for showing cumulative totals over time)
      - 'radar' - Radar Chart (good for comparing multiple variables)
      - 'polar' - Polar Chart (good for cyclical or periodic data)
      - 'gauge' - Gauge Chart (good for showing a single value in a range)
      - 'heatmap' - Heatmap (good for showing patterns in a matrix)
      - 'treemap' - Treemap (good for hierarchical data)
      - 'table' - Table (when data is better shown as a table than a chart)
      
      For multiple query results, you can suggest:
      1. A single chart that combines data from multiple queries
      2. Multiple charts (one per query) with clear explanations of what each shows
      3. A dashboard layout with multiple visualizations
      
      If the data combines information from multiple tables (through JOINs or as separate queries), ensure your chart configuration highlights these relationships effectively. Consider how cost data, sales data, and employee data can be visually correlated when appropriate.
      
      Provide clear titles, axis labels, and legends for all chart configurations.
      `,
      prompt: `Create a chart configuration that best represents the data returned by these SQL queries.

      User Query: ${userQuery}

      Query Results:
      ${formattedResults}

      Provide a complete chart configuration for this data. If multiple visualizations would be better than a single one, provide configurations for each.`,
    });
    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate chart configuration");
  }
};

export const generateDataInsights = async (
  queryResults: { queryName: string; queryDescription: string; data: any[] }[],
  userQuery: string,
) => {
  "use server";
  try {
    // Format the query results for the prompt
    const formattedResults = queryResults.map((qr, i) => {
      const sampleData = qr.data.slice(0, 5); // Take first 5 rows as sample
      return `Query ${i + 1} (${qr.queryName}): ${qr.queryDescription}\nSample data (${qr.data.length} total rows):\n${JSON.stringify(sampleData, null, 2)}`;
    }).join('\n\n');

    // Define schema for insights
    const insightsSchema = z.object({
      summary: z.string().describe("A concise 1-2 sentence summary of the data"),
      keyFindings: z.array(z.object({
        title: z.string().describe("A brief title for the insight"),
        description: z.string().describe("A detailed explanation of the insight"),
        importance: z.enum(["high", "medium", "low"]).describe("The relative importance of this insight")
      })).describe("Key findings and patterns in the data"),
      recommendedActions: z.array(z.string()).describe("Suggested actions based on the data insights"),
      anomalies: z.array(z.object({
        description: z.string().describe("Description of the anomaly or unusual pattern"),
        possibleExplanations: z.array(z.string()).describe("Possible explanations for this anomaly")
      })).optional().describe("Any anomalies or unusual patterns in the data"),
      correlations: z.array(z.object({
        variables: z.array(z.string()).describe("The variables that show correlation"),
        relationship: z.string().describe("Description of the relationship between these variables"),
        strength: z.enum(["strong", "moderate", "weak"]).describe("The strength of the correlation")
      })).optional().describe("Notable correlations between different variables in the data"),
      trends: z.array(z.object({
        variable: z.string().describe("The variable showing a trend"),
        description: z.string().describe("Description of the trend"),
        direction: z.enum(["increasing", "decreasing", "fluctuating", "stable"]).describe("The direction of the trend")
      })).optional().describe("Identified trends in the data over time or categories")
    });

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: insightsSchema,
      system: `You are a data analyst and business intelligence expert for a restaurant business. Your job is to analyze SQL query results and provide meaningful insights, patterns, and recommendations based on the data.
      
      The data comes from a restaurant management system with these main tables:
      - time_entries: Contains employee work shift data, hours, wages, and tips
      - item_selection_details: Contains food/beverage orders, prices, and dining details
      - food_costs: Contains inventory costs, product details, and sales information
      
      Provide a thorough analysis that includes:
      1. A concise summary of what the data shows
      2. Key findings and their business implications
      3. Recommended actions based on these findings
      4. Any anomalies or unusual patterns
      5. Notable correlations between different variables
      6. Trends identified in the data
      
      Focus on actionable insights that would be valuable to a restaurant business. Some important business areas to consider include:
      - Labor costs and efficiency
      - Food costs and inventory management
      - Sales performance and menu item popularity
      - Profitability analysis (comparing costs to sales)
      - Operational efficiency
      
      Be specific and reference actual values from the data when possible. Avoid vague generalizations.
      
      For multiple query results, analyze each dataset individually and then provide cross-query insights that combine information from different tables when relevant. If the queries include data from multiple tables (like time_entries, item_selection_details, and food_costs), look for relationships between employee data, sales data, and cost data.
      `,
      prompt: `Analyze the following SQL query results and provide meaningful insights, patterns, and recommendations for this restaurant business.

      User Query: ${userQuery}

      Query Results:
      ${formattedResults}

      Provide a detailed analysis with actionable insights.`,
    });

    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate data insights");
  }
};

// Re-export types for the client
export type { Config };
