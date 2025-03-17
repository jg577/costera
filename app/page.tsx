"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateChartConfig,
  generateQuery,
  runGenerateSQLQuery,
  generateDataInsights
} from "./actions";
import { Config, Result, SqlQuery, QueryResult, Insights } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Results } from "@/components/results";
import { SuggestedQueries } from "@/components/suggested-queries";
import { QueryViewer } from "@/components/query-viewer";
import { Search } from "@/components/search";
import { Header } from "@/components/header";

export default function Page() {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [queries, setQueries] = useState<SqlQuery[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [selectedQueryIndex, setSelectedQueryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [chartConfig, setChartConfig] = useState<Config | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const handleClear = () => {
    setInputValue("");
    setSubmitted(false);
    setQueries([]);
    setQueryResults([]);
    setSelectedQueryIndex(0);
    setChartConfig(null);
    setInsights(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    setSubmitted(true);
    setLoading(true);
    setLoadingStep(1);
    setChartConfig(null);
    setInsights(null);

    try {
      // Generate the SQL query
      const generatedQueries = await generateQuery(inputValue);
      setQueries(generatedQueries);

      // Execute the SQL queries
      setLoadingStep(2);
      const results = await runGenerateSQLQuery(generatedQueries);
      setQueryResults(results);
      setLoading(false);

      // Generate chart config for the query results
      const config = await generateChartConfig(results, inputValue);
      setChartConfig(config);

      // Generate insights from the data
      setLoadingInsights(true);
      try {
        const dataInsights = await generateDataInsights(results, inputValue);
        setInsights(dataInsights);
      } catch (error) {
        console.error("Failed to generate insights:", error);
        toast.error("Failed to generate insights. We'll keep the charts and tables ready for you.");
      } finally {
        setLoadingInsights(false);
      }
    } catch (error) {
      console.error("Failed to execute query:", error);
      toast.error("Failed to execute query");
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  const handleQuerySelect = (index: number) => {
    setSelectedQueryIndex(index);
  };

  const activeQuery = queries.length > 0 ? queries[selectedQueryIndex]?.sql || "" : "";
  const activeQueryName = queries.length > 0 ? queries[selectedQueryIndex]?.queryName || "" : "";

  const activeQueryResults = queryResults.length > 0
    ? queryResults[selectedQueryIndex]?.data || []
    : [];

  const columns = activeQueryResults.length > 0 ? Object.keys(activeQueryResults[0]) : [];

  return (
    <div className="bg-background flex items-start justify-center p-0 sm:p-8 min-h-screen">
      <div className="w-full max-w-4xl min-h-dvh sm:min-h-0 flex flex-col">
        <motion.div
          className="surface bg-card rounded-md flex-grow flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="p-6 sm:p-8 flex flex-col flex-grow">
            <Header handleClear={handleClear} />
            <Search
              handleClear={handleClear}
              handleSubmit={handleSubmit}
              inputValue={inputValue}
              setInputValue={setInputValue}
              submitted={submitted}
            />
            <div
              id="main-container"
              className="flex-grow flex flex-col sm:min-h-[420px]"
            >
              <div className="flex-grow h-full">
                <AnimatePresence mode="wait">
                  {!submitted ? (
                    <SuggestedQueries
                      handleSuggestionClick={handleSuggestionClick}
                    />
                  ) : (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                      className="sm:h-full min-h-[400px] flex flex-col"
                    >
                      {queries.length > 0 && (
                        <>
                          {queries.length > 1 && (
                            <div className="flex overflow-x-auto gap-2 mb-3">
                              {queries.map((query, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleQuerySelect(index)}
                                  className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors ${selectedQueryIndex === index
                                    ? "bg-primary text-primary-foreground"
                                    : "tab-button"
                                    }`}
                                >
                                  {query.queryName}
                                </button>
                              ))}
                            </div>
                          )}
                          <QueryViewer
                            activeQuery={activeQuery}
                            activeQueryName={activeQueryName}
                            inputValue={inputValue}
                          />
                        </>
                      )}
                      {loading ? (
                        <div className="h-full absolute bg-background/90 w-full flex flex-col items-center justify-center space-y-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-foreground text-sm">
                            {loadingStep === 1
                              ? "Generating SQL queries..."
                              : "Running SQL queries..."}
                          </p>
                        </div>
                      ) : activeQueryResults.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center">
                          <p className="text-center text-muted-foreground text-sm">
                            No results found.
                          </p>
                        </div>
                      ) : (
                        <Results
                          results={activeQueryResults}
                          chartConfig={chartConfig}
                          insights={insights}
                          loadingInsights={loadingInsights}
                          columns={columns}
                          queryResults={queryResults}
                          selectedQueryIndex={selectedQueryIndex}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
