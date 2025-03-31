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

      Table: menu_mappings
      # column_name            data_type                           is_nullable
      1  id                    text                                NO (PRIMARY KEY)
      2  index                 text                                YES
      3  item_name             text                                NO
      4  menu_group            text                                YES
      5  business_line         text                                YES
      6  category              text                                YES
      7  ounces                numeric(10,2)                       YES
      8  product_name          text                                YES
      9  product_type          text                                YES
      10 package_amount        text                                YES
      11 created_at            timestamp without time zone         NO
      12 updated_at            timestamp without time zone         NO

    Only retrieval queries are allowed.

    EVERY QUERY SHOULD RETURN QUANTITATIVE DATA THAT CAN BE PLOTTED ON A CHART! There should always be at least two columns. If the user asks for a single column, return the column and the count of the column.
    
    The time_entries table contains information about employee work shifts, including the employee details, hours worked, wages, and tips.
    The item_selection_details table contains information about food/beverage orders, their prices, and details about the dining experience.
    The food_costs table contains information about food inventory costs, including product details, pricing, and inventory information.
    The menu_mappings table provides standardized mappings between the adhoc menu item names in item_selection_details.menu_item and standardized product names, essential for accurate analytics.
    
    The tables can be joined on relevant fields for cross-table analysis:
    - time_entries and item_selection_details can be joined on location fields for location-based analysis.
    - item_selection_details and food_costs can be joined on product information (like item_name, sku) for cost vs. sales analysis.
    - item_selection_details and menu_mappings should be joined (item_selection_details.menu_item = menu_mappings.item_name) to standardize menu items for accurate analytics.
    - All tables can be used together for comprehensive analyses of operations, costs, and sales.

    Example standard query for menu item analysis using menu_mappings:
    
    SELECT mp.product_name, SUM(isd.total_price) AS total_sales
    FROM item_selection_details isd 
    JOIN menu_mappings mp ON isd.menu_item = mp.item_name 
    GROUP BY mp.product_name 
    ORDER BY total_sales DESC
    
    This query transforms the adhoc menu_item names into standardized product_name values for accurate analysis.

    For time series analysis across tables (especially time_entries, food_costs, and item_selection_details):
    - First group by time periods (day, week, month) within each table
    - Then join the aggregated results on the common time periods
    - This approach is more efficient and produces cleaner results than joining raw tables
    
    Example of time series join with proper grouping:
    
    -- First query: Get monthly time entries data
    WITH monthly_time AS (
      SELECT 
        DATE_TRUNC('month', start_time) AS month,
        SUM(total_hours) AS total_hours,
        AVG(wage) AS avg_wage
      FROM time_entries
      GROUP BY DATE_TRUNC('month', start_time)
    ),
    -- Second: Get monthly sales data
    monthly_sales AS (
      SELECT 
        DATE_TRUNC('month', sent_date) AS month,
        SUM(total_price) AS total_sales
      FROM item_selection_details
      GROUP BY DATE_TRUNC('month', sent_date)
    )
    -- Join the aggregated monthly data
    SELECT 
      mt.month,
      mt.total_hours,
      mt.avg_wage,
      ms.total_sales,
      (ms.total_sales / NULLIF(mt.total_hours, 0)) AS sales_per_hour
    FROM monthly_time mt
    JOIN monthly_sales ms ON mt.month = ms.month
    ORDER BY mt.month

    IMPORTANT: You have two options for generating queries:
    
    1. SINGLE QUERY WITH JOINS: If the user's request can be satisfied with a single query that uses JOIN operations, you may use that approach.
    
    2. MULTIPLE SEPARATE QUERIES: You are encouraged to generate multiple separate SQL queries when appropriate, especially when:
       - The user is asking for multiple distinct metrics or insights
       - Different parts of the analysis require different groupings or time periods
       - The data would be clearer if presented in separate result sets
       - Complex JOINs might make the query inefficient or the results harder to interpret

    Example 1

    user query: are we getting better or worse?
    
    generated sql:
    "
    SELECT 
    DATE_TRUNC('month', order_date) AS month,
    SUM(net_price) AS total_sales,
    CASE 
        WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE) THEN 'Current Month'
        WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN 'Last Month'
        WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months') THEN '2 Months Ago'
        WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months') THEN '3 Months Ago'
        WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year') THEN 'Last Year Same Month'
    END AS period_label
    FROM item_selection_details
    WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')
        AND order_date <= CURRENT_DATE
        
    GROUP BY DATE_TRUNC('month', order_date)
    HAVING DATE_TRUNC('month', order_date) IN (
        DATE_TRUNC('month', CURRENT_DATE),                    -- Current month
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), -- Last month
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months'),-- 2 months ago
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months'),-- 3 months ago
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')   -- Last year same month
    )
    ORDER BY month DESC;
    "

    Example 2:

    user query: what product_name selling at a higher rate than ever before

    generated sql:
    "
    WITH monthly_sales AS (
        -- Aggregate sales by product_name and month
        SELECT 
            mm.product_name,
            DATE_TRUNC('month', isd.order_date) AS sales_month,
            SUM(isd.qty) AS total_quantity,
            COUNT(DISTINCT isd.order_date::DATE) AS days_in_month,
            SUM(isd.qty)::FLOAT / COUNT(DISTINCT isd.order_date::DATE) AS avg_quantity_per_day
        FROM 
            item_selection_details isd
        LEFT JOIN 
            menu_mappings mm
            ON isd.menu_item = mm.menu_item
            AND coalesce(isd.menu_group, 'Null') = coalesce(mm.menu_group, 'Null')
        GROUP BY 
            mm.product_name,
            DATE_TRUNC('month', isd.order_date)
        HAVING 
            SUM(isd.qty) > 0  -- Ensure some sales
    ),
    max_historical AS (
        -- Max historical rate (excluding latest month)
        SELECT 
            product_name,
            MAX(avg_quantity_per_day) AS max_historical_rate,
            COUNT(DISTINCT sales_month) AS month_count
        FROM 
            monthly_sales
        WHERE 
            sales_month < (SELECT MAX(DATE_TRUNC('month', order_date)) FROM item_selection_details)
        GROUP BY 
            product_name
        HAVING 
            COUNT(DISTINCT sales_month) >= 2  -- At least 2 months of history
    ),
    current_rate AS (
        -- Current rate (latest month)
        SELECT 
            product_name,
            avg_quantity_per_day AS current_rate,
            total_quantity AS current_quantity,
            sales_month AS current_month
        FROM 
            monthly_sales
        WHERE 
            sales_month = (SELECT MAX(DATE_TRUNC('month', order_date)) FROM item_selection_details)
    )
    SELECT 
        cr.product_name,
        cr.current_month,
        cr.current_quantity,
        ROUND(cr.current_rate::NUMERIC, 2) AS current_rate,
        ROUND(mh.max_historical_rate::NUMERIC, 2) AS max_historical_rate,
        ROUND((cr.current_rate - mh.max_historical_rate)::NUMERIC, 2) AS rate_increase
    FROM 
        current_rate cr
    JOIN 
        max_historical mh
        ON cr.product_name = mh.product_name
    WHERE 
        cr.current_rate > mh.max_historical_rate
    ORDER BY 
        rate_increase DESC;"

    Example 3:

    user query: what product category sells more than others?

    generated sql:
    "
    "WITH monthly_special_sales AS (
    SELECT 
        mm.product_name,
        DATE_TRUNC('month', isd.order_date) AS sales_month,
        SUM(isd.qty) AS total_quantity,
        SUM(isd.net_price) AS total_sales
    FROM 
        item_selection_details isd
    JOIN 
        menu_mappings mm
        ON isd.menu_item = mm.menu_item
        AND COALESCE(isd.menu_group, 'Null') = COALESCE(mm.menu_group, 'Null')
    WHERE 
        mm.category in ('Special - Bowl',  'Special - Sandwich', 'Special - Plate')
    GROUP BY 
        mm.product_name,
        DATE_TRUNC('month', isd.order_date)
    HAVING 
        SUM(isd.net_price) > 0
    ),
    ranked_sales AS (
        SELECT 
            sales_month,
            product_name,
            total_quantity,
            total_sales,
            RANK() OVER (PARTITION BY sales_month ORDER BY total_sales DESC) AS sales_rank
        FROM 
            monthly_special_sales
    )
    SELECT 
        sales_month,
        product_name,
        total_quantity,
        total_sales,
        sales_rank
    FROM 
        ranked_sales
    WHERE 
        sales_rank <= 10
    ORDER BY 
        sales_month ASC,
        total_sales DESC;"



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

      Table: menu_mappings
      # column_name            data_type                           is_nullable
      1  id                    text                                NO (PRIMARY KEY)
      2  index                 text                                YES
      3  item_name             text                                NO
      4  menu_group            text                                YES
      5  business_line         text                                YES
      6  category              text                                YES
      7  ounces                numeric(10,2)                       YES
      8  product_name          text                                YES
      9  product_type          text                                YES
      10 package_amount        text                                YES
      11 created_at            timestamp without time zone         NO
      12 updated_at            timestamp without time zone         NO

    When you explain you must take a section of the query, and then explain it. Each "section" should be unique. So in a query like: "SELECT * FROM time_entries limit 20", the sections could be "SELECT *", "FROM time_entries", "LIMIT 20".

    The time_entries table contains information about employee work shifts, including the employee details, hours worked, wages, and tips.
    The item_selection_details table contains information about food/beverage orders, their prices, and details about the dining experience.
    The food_costs table contains information about food inventory costs, including product details, pricing, and inventory information.
    The menu_mappings table provides standardized mappings between the adhoc menu item names in item_selection_details.menu_item and standardized product names, essential for accurate analytics.

    Example standard query for menu item analysis using menu_mappings:
    
    SELECT mp.product_name, SUM(isd.total_price) AS total_sales
    FROM item_selection_details isd 
    JOIN menu_mappings mp ON isd.menu_item = mp.item_name 
    GROUP BY mp.product_name 
    ORDER BY total_sales DESC
    
    This query transforms the adhoc menu_item names into standardized product_name values for accurate analysis.
    
    For time series analysis across tables (especially time_entries, food_costs, and item_selection_details):
    - First group by time periods (day, week, month) within each table
    - Then join the aggregated results on the common time periods
    - This approach is more efficient and produces cleaner results than joining raw tables
    - Use functions like DATE_TRUNC('month', timestamp_column) for consistent grouping

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
      - menu_mappings: Contains standardized mappings between adhoc menu item names and consistent product names

      For menu item analytics, the standard approach is to join item_selection_details with menu_mappings:
      
      SELECT mp.product_name, SUM(isd.total_price) AS total_sales
      FROM item_selection_details isd 
      JOIN menu_mappings mp ON isd.menu_item = mp.item_name 
      GROUP BY mp.product_name 
      ORDER BY total_sales DESC
      
      This allows for standardized product analysis and visualization rather than working with inconsistent menu_item values.

      For time series analysis across tables (especially time_entries, food_costs, and item_selection_details):
      - First group by time periods (day, week, month) within each table
      - Then join the aggregated results on the common time periods
      - This approach is more efficient and produces cleaner visualizations than joining raw tables
      - Example: GROUP BY DATE_TRUNC('month', timestamp_column)

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
      
      DATA FORMATTING REQUIREMENTS:
      1. TIME SERIES: For any data with dates or times, ALWAYS ensure the data is sorted chronologically FROM OLDER TO NEWER dates (oldest first, most recent last).
         - Time must ALWAYS move forward in charts - data points should be in strict chronological order.
         - If data for certain time periods is missing, SKIP those periods rather than breaking chronological order.
         - Time labels MUST include BOTH month and year (e.g., "Jan 2023", "Feb 2023") for clear time reference.
         - Never abbreviate years or use ambiguous date formats.
      2. MONETARY VALUES: For any costs, revenue, sales, or other monetary amounts, make sure the chart labels include dollar signs ($).
      3. NUMBER FORMATTING: All numeric values should be properly formatted with commas for thousands (e.g., $1,234.56 instead of $1234.56).
      
      IMPORTANT - CONSOLIDATED VIEWS:
      When there are multiple queries, PREFER creating a consolidated view that combines data from all queries into a single chart, table and summary.
      1. Use the 'isConsolidated' field and set it to true to indicate this is a consolidated view
      2. In the 'consolidation' object, provide details about how the data should be combined:
         - 'method': How to combine data ('merge', 'stack', 'join')
         - 'keyField': Common field to join on, if applicable
         - 'valueFields': Which fields contain the values to be consolidated
         - 'labelFields': **REQUIRED** - A mapping of original field names to display labels (e.g., {"total_revenue": "Total Revenue ($)", "employee_cost": "Employee Cost ($)"})
         - 'sourceQueries': Names of the queries being consolidated
      3. Create clear labels and color coding to distinguish data from different queries
      4. Provide a clear explanation of what the consolidated view shows in the description
      
      CRITICAL: The 'labelFields' property in the consolidation object is REQUIRED and must be a non-empty object that maps 
      field names from the source data to their human-readable display labels. Include ALL value fields and any other important 
      fields that will be displayed in the chart or table.
      
      ADDITIONAL CHART REQUIREMENTS:
      1. For time-based charts (especially line and area charts), data MUST be arranged FROM OLDER TO NEWER dates (oldest first, most recent last).
         - Missing time periods should be SKIPPED while maintaining the forward progression of time.
         - Time must ALWAYS move forward - never display dates out of chronological order.
         - ALWAYS include BOTH month and year in axis labels and tooltips for time data (e.g., "Jan 2023", "Feb 2023").
         - For more granular time data, include day, month, and year (e.g., "15 Jan 2023").
      2. For monetary values, include dollar signs ($) in axis labels and legends.
      3. For any field that represents money (costs, sales, revenue, etc.), include "($)" in the label name.
      4. Use descriptive axis labels that clearly indicate what the data represents.
      
      For multiple query results that CANNOT be consolidated, you can suggest:
      1. Multiple charts (one per query) with clear explanations of what each shows
      2. A dashboard layout with multiple visualizations
      
      If the data combines information from multiple tables (through JOINs or as separate queries), ensure your chart configuration highlights these relationships effectively. Consider how cost data, sales data, and employee data can be visually correlated when appropriate.
      
      Provide clear titles, axis labels, and legends for all chart configurations.
      `,
      prompt: `Create a chart configuration that best represents the data returned by these SQL queries.

      User Query: ${userQuery}

      Query Results:
      ${formattedResults}

      When there are multiple queries, STRONGLY PREFER creating a consolidated view that combines all the data into a single comprehensive visualization rather than separate charts. Provide a complete chart configuration for this data.

      REMEMBER: 
      1. If you create a consolidated view (isConsolidated: true), you MUST include the 'labelFields' object in the consolidation configuration that maps field names to human-readable labels.
      2. For time series data, ensure the data is sorted chronologically FROM OLDER TO NEWER dates (oldest first, most recent last).
      3. Time must ALWAYS move forward - if data is missing for certain periods, SKIP those periods rather than breaking chronological order.
      4. All time labels MUST include BOTH month and year (e.g., "Jan 2023") for clarity.
      5. For monetary values (costs, revenue, sales), include dollar signs ($) in labels and format numbers with commas for thousands.
      6. Make sure all monetary field labels include "($)" to indicate they represent dollar amounts.`,
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
      })).optional().describe("Identified trends in the data over time or categories"),
      crossQueryInsights: z.array(z.object({
        title: z.string().describe("A brief title for the cross-query insight"),
        description: z.string().describe("A detailed explanation of how the different data sources relate to each other"),
        relevance: z.enum(["primary", "secondary"]).describe("Whether this is a primary or secondary insight")
      })).optional().describe("Insights that specifically connect or combine data from multiple queries")
    });

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: insightsSchema,
      system: `You are a data analyst and business intelligence expert for a restaurant business. Your job is to analyze SQL query results and provide meaningful insights, patterns, and recommendations based on the data.
      
      The data comes from a restaurant management system with these main tables:
      - time_entries: Contains employee work shift data, hours, wages, and tips
      - item_selection_details: Contains food/beverage orders, prices, and dining details
      - food_costs: Contains inventory costs, product details, pricing, and inventory information
      - menu_mappings: Contains standardized mappings between adhoc menu item names and consistent product names
      
      For menu item analytics, the standard approach is to join item_selection_details with menu_mappings:
      
      SELECT mp.product_name, SUM(isd.total_price) AS total_sales
      FROM item_selection_details isd 
      JOIN menu_mappings mp ON isd.menu_item = mp.item_name 
      GROUP BY mp.product_name 
      ORDER BY total_sales DESC
      
      This allows for standardized product analysis rather than working with inconsistent menu_item values.
      
      For time series analysis across tables (especially time_entries, food_costs, and item_selection_details):
      - First group by time periods (day, week, month) within each table
      - Then join the aggregated results on the common time periods
      - This approach reveals clearer trends and patterns than analyzing raw joined data
      
      Provide a comprehensive analysis that includes:
      1. A concise summary of what the data shows
      2. Key findings and their business implications
      3. Recommended actions based on these findings
      4. Any anomalies or unusual patterns
      5. Notable correlations between different variables
      6. Trends identified in the data
      7. Cross-query insights that connect data from multiple sources
      
      Focus on actionable insights that would be valuable to a restaurant business. Some important business areas to consider include:
      - Labor costs and efficiency
      - Food costs and inventory management
      - Sales performance and menu item popularity
      - Profitability analysis (comparing costs to sales)
      - Operational efficiency
      
      Be specific and reference actual values from the data when possible. Avoid vague generalizations.
      
      MULTIPLE QUERY ANALYSIS:
      When analyzing multiple query results, focus on:
      1. Analyzing individual datasets for their specific insights
      2. Creating CROSS-QUERY INSIGHTS that connect data across different tables
      3. Looking for cause-and-effect relationships between different metrics
      4. Identifying how employee data, sales data, and cost data interact with each other
      5. Finding holistic business patterns that would not be visible in any single query alone
      
      For multiple tables (like time_entries, item_selection_details, and food_costs), emphasize how they relate to each other. For example:
      - How labor patterns affect sales performance
      - How inventory costs correlate with menu item popularity
      - How staffing levels impact customer experience metrics
      
      In your crossQueryInsights section, focus specifically on insights that require data from multiple queries to discover.
      `,
      prompt: `Analyze the following SQL query results and provide meaningful insights, patterns, and recommendations for this restaurant business.

      User Query: ${userQuery}

      Query Results:
      ${formattedResults}

      Provide a detailed analysis with actionable insights, including cross-query connections where multiple data sources are present.`,
    });

    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate data insights");
  }
};

// Re-export types for the client
export type { Config };
