import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState, useEffect } from "react";

type QueryCategory = {
  title: string;
  queries: {
    desktop: string;
    mobile: string;
    sql?: string; // Optional SQL query associated with this suggestion
  }[];
};

export const SuggestedQueries = ({
  handleSuggestionClick,
}: {
  handleSuggestionClick: (suggestion: string, sql?: string) => void;
}) => {
  const [expandedCategories, setExpandedCategories] = useState<{
    [key: string]: boolean;
  }>({
    sales: true,
    timeEntries: true,
    costs: true,
  });
  
  // Track if we're on mobile for responsive content
  const [isMobile, setIsMobile] = useState(false);
  
  // Set up mobile detection when component mounts
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Check immediately
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const queryCategories: QueryCategory[] = [
    {
      title: "Sales",
      queries: [
        {
          desktop: "What are the daily sales trends for the last 4 weeks by weekday?",
          mobile: "Daily Sales Trends - Last 4 weeks",
          sql: `
            SELECT
            EXTRACT(DOW FROM order_date) AS weekday_number,
            TO_CHAR(order_date, 'Day') AS weekday_name,
            SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '8 days' AND order_date < CURRENT_DATE - INTERVAL '1 day' THEN net_price ELSE 0 END) AS sales_week_minus_1,
            SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '15 days' AND order_date < CURRENT_DATE - INTERVAL '8 days' THEN net_price ELSE 0 END) AS sales_week_minus_2,
            SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '22 days' AND order_date < CURRENT_DATE - INTERVAL '15 days' THEN net_price ELSE 0 END) AS sales_week_minus_3,
            SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '29 days' AND order_date < CURRENT_DATE - INTERVAL '22 days' THEN net_price ELSE 0 END) AS sales_week_minus_4
            FROM
            item_selection_details
            WHERE
            order_date >= CURRENT_DATE - INTERVAL '29 days'
            AND order_date < CURRENT_DATE - INTERVAL '1 day'
            AND (void IS NULL OR lower(void) = 'false')
            GROUP BY
            EXTRACT(DOW FROM order_date),
            TO_CHAR(order_date, 'Day')
            ORDER BY
            weekday_number ASC;
            `,
        },
        {
          desktop: "How do sales compare year-over-year for each month?",
          mobile: "Monthly Sales Comparison - Year Over Year",
          sql: `
          SELECT TO_CHAR(order_date, 'Month') AS month_name, SUM(CASE WHEN EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE) - 2 THEN net_price ELSE 0 END) AS sales_two_years_ago, SUM(CASE WHEN EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE) - 1 THEN net_price ELSE 0 END) AS sales_last_year, SUM(CASE WHEN EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE) THEN net_price ELSE 0 END) AS sales_current_year FROM item_selection_details WHERE order_date >= CURRENT_DATE - INTERVAL '3 years' AND (void IS NULL OR lower(void) = 'false') GROUP BY EXTRACT(MONTH FROM order_date), TO_CHAR(order_date, 'Month') ORDER BY EXTRACT(MONTH FROM order_date)  ASC;`,
        },
        {
          desktop: "What are the average sales hourly by weekday seasonally",
          mobile: "Average Sales by Hourly by Weekday Seasonally",
          sql: `
            WITH SalesData AS (
              SELECT
                  EXTRACT(HOUR FROM isd.order_date) AS hour_of_day,
                  TRIM(TO_CHAR(isd.order_date, 'Day')) AS weekday, -- Trim spaces from 'Day'
                  CASE 
                      WHEN EXTRACT(MONTH FROM isd.order_date) IN (12, 1, 2) THEN 'Winter'
                      WHEN EXTRACT(MONTH FROM isd.order_date) IN (3, 4, 5) THEN 'Spring'
                      WHEN EXTRACT(MONTH FROM isd.order_date) IN (6, 7, 8) THEN 'Summer'
                      WHEN EXTRACT(MONTH FROM isd.order_date) IN (9, 10, 11) THEN 'Fall'
                  END AS season,
                  SUM(isd.net_price) AS total_sales,
                  COUNT(DISTINCT DATE_TRUNC('day', isd.order_date)) AS distinct_days
              FROM 
                  item_selection_details isd
                  JOIN menu_mappings mm
                    ON isd.menu_item = mm.menu_item
                    AND COALESCE(isd.menu_group, 'Null') = COALESCE(mm.menu_group, 'Null')
              WHERE 
                  (isd.void IS NULL OR lower(isd.void) = 'false')
                  AND mm.category != 'Catering'
                  AND isd.order_date >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '2 years')
              GROUP BY
                  EXTRACT(HOUR FROM isd.order_date),
                  TRIM(TO_CHAR(isd.order_date, 'Day')),
                  CASE 
                      WHEN EXTRACT(MONTH FROM isd.order_date) IN (12, 1, 2) THEN 'Winter'
                      WHEN EXTRACT(MONTH FROM isd.order_date) IN (3, 4, 5) THEN 'Spring'
                      WHEN EXTRACT(MONTH FROM isd.order_date) IN (6, 7, 8) THEN 'Summer'
                      WHEN EXTRACT(MONTH FROM isd.order_date) IN (9, 10, 11) THEN 'Fall'
                  END
          ),
          AvgSales AS (
              SELECT
                  season,
                  hour_of_day,
                  weekday,
                  total_sales / (distinct_days * 1.0) AS avg_sales_per_hour
              FROM SalesData
          )
          SELECT
              season,
              hour_of_day,
              MAX(CASE WHEN weekday = 'Monday' THEN avg_sales_per_hour END) AS monday_avg,
              MAX(CASE WHEN weekday = 'Tuesday' THEN avg_sales_per_hour END) AS tuesday_avg,
              MAX(CASE WHEN weekday = 'Wednesday' THEN avg_sales_per_hour END) AS wednesday_avg,
              MAX(CASE WHEN weekday = 'Thursday' THEN avg_sales_per_hour END) AS thursday_avg,
              MAX(CASE WHEN weekday = 'Friday' THEN avg_sales_per_hour END) AS friday_avg,
              MAX(CASE WHEN weekday = 'Saturday' THEN avg_sales_per_hour END) AS saturday_avg,
              MAX(CASE WHEN weekday = 'Sunday' THEN avg_sales_per_hour END) AS sunday_avg,
              AVG(avg_sales_per_hour) AS season_avg_sales
          FROM
              AvgSales
          GROUP BY
              season, hour_of_day
          ORDER BY
              season, hour_of_day;`,
        },

      ],
    },
    {
      title: "Costs",
      queries: [
        {
          desktop: "Show me the items that cost per lbs is at or near 52 week highs",
          mobile: "Items Near 52 Week Highs",
          sql: `WITH annual_spend AS (
                    SELECT
                        cg.item,
                        SUM(c.sales) AS total_spend
                    FROM
                        costs c
                        JOIN costs_groups cg ON c.item_name = cg.item_name
                    WHERE
                        c.date >= CURRENT_DATE - INTERVAL '1 year'
                    GROUP BY cg.item
                    HAVING SUM(c.sales) > 5000
                ),
                price_per_lbs_history AS (
                    SELECT
                        cg.item,
                        c.date,
                        sum(c.sales) as sales,
                        sum(NULLIF(c.weight,0)) AS weight,
                        sum(c.sales) / sum(c.weight) AS price_per_lbs,
                        ROW_NUMBER() OVER (PARTITION BY cg.item ORDER BY c.date DESC) AS rn
                    FROM
                        costs c
                        JOIN costs_groups cg ON c.item_name = cg.item_name
                    WHERE
                        c.date >= CURRENT_DATE - INTERVAL '1 year'
                        and c.weight > 0
                    group by 1,2
                ),
                highs AS (
                    SELECT
                        item,
                        MAX(price_per_lbs) AS high_price_per_lbs,
                        MAX(date) FILTER (
                            WHERE price_per_lbs = (
                                SELECT MAX(price_per_lbs)
                                FROM price_per_lbs_history h2
                                WHERE h2.item = h1.item
                            )
                        ) AS high_price_per_lbs_date
                    FROM
                        price_per_lbs_history h1
                    GROUP BY item
                ),
                most_recent AS (
                    SELECT
                        item,
                        date AS most_recent_purchase_date,
                        price_per_lbs AS most_recent_price_per_lbs
                    FROM price_per_lbs_history
                    WHERE rn = 1
                ),
                final AS (
                    SELECT
                        a.item,
                        a.total_spend,
                        h.high_price_per_lbs,
                        h.high_price_per_lbs_date,
                        m.most_recent_purchase_date,
                        m.most_recent_price_per_lbs
                    FROM
                        annual_spend a
                        JOIN highs h ON a.item = h.item
                        JOIN most_recent m ON a.item = m.item
                )
                SELECT
                    item AS "Item",
                    total_spend AS "Amount Spent Last 12M",
                    high_price_per_lbs AS "52wk High Price Per lbs",
                    high_price_per_lbs_date AS "Date of 52wk High",
                    most_recent_purchase_date AS "Most Recent Purchase Date",
                    most_recent_price_per_lbs AS "Recent Price Per lbs",
                    ROUND(100 * most_recent_price_per_lbs / NULLIF(high_price_per_lbs, 0), 1) AS "Recent Price as % of 52wk High"
                FROM final
                WHERE
                    most_recent_price_per_lbs >= high_price_per_lbs * 0.70 -- "near high = within 5% of 52 week high
                ORDER BY "Recent Price as % of 52wk High" DESC, total_spend DESC;
          `,
        },

      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Suggested Queries</h2>
        <p className="text-lg text-gray-600">Click on any of these queries to get instant analytics</p>
      </div>
      
      <div className="space-y-6">
        {queryCategories.map((category, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <button
              onClick={() => toggleCategory(category.title)}
              className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
              </div>
              <ChevronDownIcon 
                className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
                  expandedCategories[category.title] ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedCategories[category.title] && (
              <div className="px-8 pb-6 space-y-3">
                {category.queries.map((query, queryIndex) => (
                  <button
                    key={queryIndex}
                    onClick={() => handleSuggestionClick(
                      isMobile ? query.mobile : query.desktop,
                      query.sql
                    )}
                    className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 border border-blue-100 hover:border-blue-200"
                  >
                    <span className="text-gray-700 font-medium">{isMobile ? query.mobile : query.desktop}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
