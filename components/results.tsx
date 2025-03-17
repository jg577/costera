import { Config, Result, Unicorn, QueryResult, Insights } from "@/lib/types";
import { DynamicChart } from "./dynamic-chart";
import { SkeletonCard } from "./skeleton-card";
import { DataInsights } from "./data-insights";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ArrowRight, ArrowLeftRight, BarChart4, TrendingUp } from "lucide-react";
import { useState } from "react";
import { CombinedComparisonChart } from "./combined-comparison-chart";

export const Results = ({
  results,
  columns,
  chartConfig,
  insights,
  queryResults,
  selectedQueryIndex,
  loadingInsights,
}: {
  results: Result[];
  columns: string[];
  chartConfig: Config | null;
  insights?: Insights | null;
  queryResults?: QueryResult[];
  selectedQueryIndex?: number;
  loadingInsights?: boolean;
}) => {
  const formatColumnTitle = (title: string) => {
    return title
      .split("_")
      .map((word, index) =>
        index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
      )
      .join(" ");
  };

  const formatCellValue = (column: string, value: any) => {
    if (column.toLowerCase().includes("valuation")) {
      const parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) {
        return "";
      }
      const formattedValue = parsedValue.toFixed(2);
      const trimmedValue = formattedValue.replace(/\.?0+$/, "");
      return `$${trimmedValue}B`;
    }
    if (column.toLowerCase().includes("rate")) {
      const parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) {
        return "";
      }
      const percentage = (parsedValue * 100).toFixed(2);
      return `${percentage}%`;
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  };

  // Check if we have related charts in the config
  const hasMultipleCharts = chartConfig?.relatedCharts && chartConfig.relatedCharts.length > 0;

  // Detect if this is a comparison query based on the user query or chart config
  const isComparisonQuery = hasMultipleCharts &&
    (chartConfig?.description.toLowerCase().includes('compar') ||
      queryResults && queryResults.length > 1 &&
      (queryResults[0]?.queryDescription.toLowerCase().includes('compar') ||
        chartConfig?.relatedCharts?.length === 1)); // Simple comparison usually has one related chart

  // For displaying combined charts (both datasets on one chart)
  const [showCombinedChart, setShowCombinedChart] = useState(false);

  // Extract key metrics for simplified summary
  const getKeyMetrics = () => {
    if (!insights || !insights.keyFindings || !insights.keyFindings.length) return [];

    // Filter for high importance findings
    return insights.keyFindings
      .filter(finding => finding.importance === 'high' || finding.title.toLowerCase().includes('compar'))
      .slice(0, 3);
  };

  return (
    <div className="flex-grow flex flex-col">
      <Tabs defaultValue="charts" className="w-full flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger
            value="charts"
            disabled={
              Object.keys(results[0] || {}).length <= 1 || results.length < 2
            }
          >
            Chart
          </TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="flex-grow">
          <div className="sm:min-h-[10px] relative">
            {queryResults && queryResults.length > 0 && selectedQueryIndex !== undefined && (
              <div className="mb-2 text-sm text-muted-foreground">
                Showing {queryResults[selectedQueryIndex]?.data.length || 0} results for {queryResults[selectedQueryIndex]?.queryName}
              </div>
            )}
            <Table className="min-w-full divide-y divide-border">
              <TableHeader className="bg-secondary sticky top-0 shadow-sm">
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      {formatColumnTitle(column)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-card divide-y divide-border">
                {results.map((company, index) => (
                  <TableRow key={index} className="hover:bg-muted">
                    {columns.map((column, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                      >
                        {formatCellValue(
                          column,
                          company[column as keyof Unicorn],
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="charts" className="flex-grow overflow-auto">
          <div className="mt-4">
            {chartConfig && results.length > 0 ? (
              <>
                {/* Comparison View */}
                {isComparisonQuery && chartConfig.relatedCharts ? (
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{chartConfig.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{chartConfig.description}</p>
                      <p className="text-sm font-medium">{chartConfig.takeaway}</p>

                      {/* Toggle between side-by-side and combined chart views */}
                      <div className="flex items-center mt-4 mb-2">
                        <div className="bg-muted rounded-md p-1 flex">
                          <button
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${!showCombinedChart
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                              }`}
                            onClick={() => setShowCombinedChart(false)}
                          >
                            Side by Side
                          </button>
                          <button
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${showCombinedChart
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                              }`}
                            onClick={() => setShowCombinedChart(true)}
                          >
                            Combined Chart
                          </button>
                        </div>
                      </div>
                    </div>

                    {showCombinedChart ? (
                      /* Combined Chart View */
                      <div className="border rounded-lg p-4 shadow-sm">
                        <h4 className="font-medium mb-3">Combined Comparison</h4>
                        {chartConfig.relatedCharts && chartConfig.relatedCharts.length > 0 && (
                          <CombinedComparisonChart
                            mainData={results}
                            mainConfig={chartConfig}
                            relatedData={queryResults && queryResults.length > 1 ?
                              queryResults.find(qr => qr.queryName === chartConfig.relatedCharts![0].queryName)?.data || [] :
                              []}
                            relatedConfig={chartConfig.relatedCharts[0]}
                          />
                        )}
                      </div>
                    ) : (
                      /* Side-by-side View */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* First chart (main chart) */}
                        <div className="border rounded-lg p-4 shadow-sm">
                          <h4 className="font-medium mb-3">{chartConfig.title}</h4>
                          <DynamicChart chartData={results} chartConfig={chartConfig} />
                        </div>

                        {/* Second chart (related chart) */}
                        {chartConfig.relatedCharts.map((relatedChart, index) => {
                          // Only display the first related chart in the side-by-side view
                          if (index > 0) return null;

                          // Find the corresponding query results
                          const relatedQueryIndex = queryResults?.findIndex(
                            qr => qr.queryName === relatedChart.queryName
                          );

                          if (relatedQueryIndex === undefined || relatedQueryIndex < 0 || !queryResults) {
                            return null;
                          }

                          const relatedData = queryResults[relatedQueryIndex].data;

                          return (
                            <div key={index} className="border rounded-lg p-4 shadow-sm">
                              <h4 className="font-medium mb-3">{relatedChart.title}</h4>
                              <DynamicChart
                                chartData={relatedData}
                                chartConfig={{
                                  ...chartConfig,
                                  ...relatedChart,
                                  description: relatedChart.description || "",
                                  takeaway: ""
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  // Standard single chart view
                  <>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <BarChart4 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{chartConfig.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{chartConfig.description}</p>
                      <p className="text-sm font-medium">{chartConfig.takeaway}</p>
                    </div>

                    <DynamicChart chartData={results} chartConfig={chartConfig} />

                    {/* Render related charts if available */}
                    {hasMultipleCharts && chartConfig.relatedCharts && (
                      <div className="mt-8 space-y-8">
                        <h3 className="text-lg font-semibold">Additional Insights</h3>
                        {chartConfig.relatedCharts.map((relatedChart, index) => {
                          // Find the corresponding query results
                          const relatedQueryIndex = queryResults?.findIndex(
                            qr => qr.queryName === relatedChart.queryName
                          );

                          if (relatedQueryIndex === undefined || relatedQueryIndex < 0 || !queryResults) {
                            return null;
                          }

                          const relatedData = queryResults[relatedQueryIndex].data;

                          return (
                            <div key={index} className="mt-6 pt-6 border-t border-border">
                              <h4 className="text-md font-medium mb-1">{relatedChart.title}</h4>
                              <p className="text-sm text-muted-foreground mb-4">{relatedChart.description}</p>
                              <DynamicChart
                                chartData={relatedData}
                                chartConfig={{
                                  ...chartConfig,
                                  ...relatedChart,
                                  description: relatedChart.description || "",
                                  takeaway: ""
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <SkeletonCard />
            )}
          </div>
        </TabsContent>
        <TabsContent value="summary" className="flex-grow overflow-auto">
          <div className="mt-4">
            {loadingInsights ? (
              <div className="flex flex-col items-center justify-center py-8">
                <SkeletonCard />
                <p className="text-muted-foreground mt-4">Analyzing your data...</p>
              </div>
            ) : (
              <>
                {/* Quick summary for comparisons */}
                {isComparisonQuery && insights && (
                  <div className="mb-8 border rounded-lg p-6 bg-muted/30">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Comparison Summary</h3>
                    </div>

                    <p className="mb-4 text-muted-foreground">{insights.summary}</p>

                    <div className="space-y-4">
                      {getKeyMetrics().map((finding, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="bg-primary/10 text-primary flex items-center justify-center h-6 w-6 rounded-full text-sm font-medium mt-0.5">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{finding.title}</h4>
                            <p className="text-sm text-muted-foreground">{finding.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {insights.recommendedActions && insights.recommendedActions.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-border">
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <ul className="space-y-2">
                          {insights.recommendedActions.slice(0, 2).map((action, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ArrowRight className="h-4 w-4 text-primary mt-1" />
                              <span className="text-sm text-muted-foreground">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Full insights */}
                <DataInsights insights={insights || null} />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
