"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateChartConfig,
  generateQuery,
  runGenerateSQLQuery,
  generateDataInsights
} from "./actions";
import { Config, Result, SqlQuery, QueryResult, Insights } from "@/lib/types";
import { Loader2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Results } from "@/components/results";
import { SuggestedQueries } from "@/components/suggested-queries";
import { QueryViewer } from "@/components/query-viewer";
import { Search } from "@/components/search";
import { Header } from "@/components/header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Define a type for a complete query session
interface QuerySession {
  id: string;
  userQuery: string;
  timestamp: Date;
  sqlQueries: SqlQuery[];
  queryResults: QueryResult[];
  chartConfig: Config | null;
  insights: Insights | null;
  selectedQueryIndex: number;
}

export default function Page() {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [querySessions, setQuerySessions] = useState<QuerySession[]>([]);
  const [currentSession, setCurrentSession] = useState<QuerySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Error handling states
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [failedQuery, setFailedQuery] = useState("");

  const searchBarRef = useRef<HTMLDivElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll to results end after new results are loaded
  useEffect(() => {
    if (submitted && !loading && resultsEndRef.current) {
      setTimeout(() => {
        resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [submitted, loading, querySessions.length]);

  // When error dialog is closed, set the failed query to the input
  useEffect(() => {
    if (!errorDialogOpen && failedQuery) {
      setInputValue(failedQuery);

      // Scroll to the search bar if we have results already
      if (querySessions.length > 0 && resultsEndRef.current) {
        setTimeout(() => {
          resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [errorDialogOpen, failedQuery, querySessions.length]);

  const handleClear = () => {
    setInputValue("");
    setSubmitted(false);
    setQuerySessions([]);
    setCurrentSession(null);
    setFailedQuery("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    // Save the query in case it fails
    const queryText = inputValue;

    // Clear the failed query
    setFailedQuery("");

    // Only show loading state, don't create the session object yet
    setLoading(true);
    setLoadingStep(1);

    try {
      // First try to generate the SQL queries
      const generatedQueries = await generateQuery(queryText);

      // If we get here, the SQL generation was successful
      // Now we can create the session and update the UI

      // Create a new session ID
      const sessionId = Date.now().toString();

      // Show that we've submitted something only after generating queries
      setSubmitted(true);

      // Create initial session object
      const newSession: QuerySession = {
        id: sessionId,
        userQuery: queryText,
        timestamp: new Date(),
        sqlQueries: generatedQueries,
        queryResults: [],
        chartConfig: null,
        insights: null,
        selectedQueryIndex: 0
      };

      // Set as current session and add to sessions list
      setCurrentSession(newSession);
      setQuerySessions(prev => [...prev, newSession]);

      // Execute the SQL queries
      setLoadingStep(2);
      const results = await runGenerateSQLQuery(generatedQueries);

      // Update the session with results
      const sessionWithResults = { ...newSession, queryResults: results };
      setCurrentSession(sessionWithResults);
      setQuerySessions(prev => prev.map(session =>
        session.id === sessionId ? sessionWithResults : session
      ));

      setLoading(false);

      // Generate chart config for the query results
      const config = await generateChartConfig(results, queryText);

      // Update the session with chart config
      const sessionWithChart = { ...sessionWithResults, chartConfig: config };
      setCurrentSession(sessionWithChart);
      setQuerySessions(prev => prev.map(session =>
        session.id === sessionId ? sessionWithChart : session
      ));

      // Generate insights from the data
      setLoadingInsights(true);
      try {
        const dataInsights = await generateDataInsights(results, queryText);

        // Final update with insights
        const completeSession = { ...sessionWithChart, insights: dataInsights };
        setCurrentSession(completeSession);
        setQuerySessions(prev => prev.map(session =>
          session.id === sessionId ? completeSession : session
        ));
      } catch (error) {
        console.error("Failed to generate insights:", error);
        toast.error("Failed to generate insights. We'll keep the charts and tables ready for you.");
      } finally {
        setLoadingInsights(false);
      }

      // Clear input for next query
      setInputValue("");

    } catch (error) {
      console.error("Failed to execute query:", error);

      // Stop loading state
      setLoading(false);

      // Store the failed query
      setFailedQuery(queryText);

      // Show error dialog
      setErrorMessage("We couldn't process your query. Please try rephrasing or simplifying your question.");
      setErrorDialogOpen(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  const handleQuerySelect = (sessionId: string, index: number) => {
    setQuerySessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, selectedQueryIndex: index }
        : session
    ));

    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => prev ? { ...prev, selectedQueryIndex: index } : null);
    }
  };

  // Handle error dialog close
  const handleErrorDialogClose = () => {
    setErrorDialogOpen(false);
  };

  // Render a single query session
  const renderQuerySession = (session: QuerySession) => {
    const activeQuery = session.sqlQueries.length > 0 ? session.sqlQueries[session.selectedQueryIndex]?.sql || "" : "";
    const activeQueryName = session.sqlQueries.length > 0 ? session.sqlQueries[session.selectedQueryIndex]?.queryName || "" : "";
    const activeQueryResults = session.queryResults.length > 0
      ? session.queryResults[session.selectedQueryIndex]?.data || []
      : [];
    const columns = activeQueryResults.length > 0 ? Object.keys(activeQueryResults[0]) : [];

    const isCurrentlyLoading = loading && currentSession?.id === session.id;
    const isLoadingInsights = loadingInsights && currentSession?.id === session.id;

    return (
      <div key={session.id} className="mb-12 pb-12 border-b border-border last:border-b-0">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{session.timestamp.toLocaleString()}</span>
        </div>

        {/* Original query display */}
        <div className="mb-4 bg-muted/30 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground">Query:</div>
          <div className="font-medium">{session.userQuery}</div>
        </div>

        {session.sqlQueries.length > 0 && (
          <>
            {session.sqlQueries.length > 1 && (
              <div className="flex overflow-x-auto gap-2 mb-3">
                {session.sqlQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuerySelect(session.id, index)}
                    className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors ${session.selectedQueryIndex === index
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
              inputValue={session.userQuery}
            />
          </>
        )}

        {isCurrentlyLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-8 mb-4 border-2 border-dashed border-muted rounded-md w-full space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-foreground text-sm">
              {loadingStep === 1
                ? "Generating SQL queries..."
                : "Running SQL queries..."}
            </p>
          </div>
        ) : activeQueryResults.length === 0 ? (
          <div className="flex items-center justify-center p-8 mb-4 border-2 border-dashed border-muted rounded-md">
            <div className="text-center">
              <p className="text-muted-foreground mb-1">No results found</p>
              <p className="text-sm text-muted-foreground">Try rephrasing your question or adjusting your search terms</p>
            </div>
          </div>
        ) : (
          <Results
            results={activeQueryResults}
            chartConfig={session.chartConfig}
            insights={session.insights}
            loadingInsights={isLoadingInsights}
            columns={columns}
            queryResults={session.queryResults}
            selectedQueryIndex={session.selectedQueryIndex}
          />
        )}
      </div>
    );
  };

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

            {/* Only show the search bar on the initial landing page */}
            {!submitted && (
              <Search
                handleClear={handleClear}
                handleSubmit={handleSubmit}
                inputValue={inputValue}
                setInputValue={setInputValue}
                submitted={submitted}
              />
            )}

            <div
              id="main-container"
              className="flex-grow flex flex-col sm:min-h-[420px] overflow-y-auto"
            >
              <div className="flex-grow h-full">
                {/* Show global loading state when submitting the first query */}
                {loading && !submitted ? (
                  <div className="flex flex-col items-center justify-center min-h-[400px] p-8 border-2 border-dashed border-primary/30 rounded-lg">
                    <div className="bg-primary/5 p-6 rounded-full mb-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Processing Your Query</h3>
                    <p className="text-center text-muted-foreground mb-4 max-w-md">
                      {loadingStep === 1
                        ? "Analyzing your question and generating the optimal SQL queries..."
                        : "Executing queries and retrieving data from the database..."}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                      {loadingStep === 1 ? "Step 1/3: Query Generation" : "Step 2/3: Data Retrieval"}
                    </div>
                  </div>
                ) : (
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
                        {/* Render all query sessions in sequence */}
                        {querySessions.map(session => renderQuerySession(session))}

                        {/* Search bar always at the bottom */}
                        <div
                          ref={resultsEndRef}
                          className="mt-8 pt-6 border-t border-border"
                        >
                          <h3 className="text-lg font-medium mb-4">Ask another question</h3>
                          <Search
                            handleClear={handleClear}
                            handleSubmit={handleSubmit}
                            inputValue={inputValue}
                            setInputValue={setInputValue}
                            submitted={submitted}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span>Error Processing Query</span>
            </DialogTitle>
            <DialogDescription>
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleErrorDialogClose}>
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
