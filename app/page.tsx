"use client";

import { useState, useRef, useEffect, createRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateChartConfig,
  generateQuery,
  runGenerateSQLQuery,
  generateDataInsights
} from "./actions";
import { Config, Result, SqlQuery, QueryResult, Insights } from "@/lib/types";
import { Loader2, Clock, AlertCircle, FileText } from "lucide-react";
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
import { Chat } from "@/components/chat";
import { useSearch } from "@/lib/search-context";
import { useSearchParams } from "next/navigation";

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
  ref: React.RefObject<HTMLDivElement | null>; // Add ref for scrolling to this session
}

// Define the conversation history structure
interface ConversationItem {
  type: 'user' | 'system';
  content: string;
  session?: QuerySession;
}

// Component to show when a query is being processed
const QueryProcessing = ({ step, question }: { step: number; question?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-8 mb-4 border-2 border-dashed border-muted rounded-md w-full space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-foreground text-sm">
      {step === 1
        ? "Generating SQL queries..."
        : "Running SQL queries..."}
    </p>
  </div>
);

// Component that uses useSearchParams
function SearchParamsHandler({ setInputValue }: { setInputValue: (value: string) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const input = searchParams.get('input');
    if (input) {
      setInputValue(decodeURIComponent(input));
    }
  }, [searchParams, setInputValue]);
  
  return null;
}

export default function Page() {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [querySessions, setQuerySessions] = useState<QuerySession[]>([]);
  const [currentSession, setCurrentSession] = useState<QuerySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [loadingInsights, setLoadingInsights] = useState(false);
  // Track which sessions have their SQL details expanded
  const [expandedSqlSessions, setExpandedSqlSessions] = useState<{[sessionId: string]: boolean}>({});

  // Conversation history for context in follow-up queries
  const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([]);

  // Error handling states
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [failedQuery, setFailedQuery] = useState("");

  const searchBarRef = useRef<HTMLDivElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);
  
  const { searchInput, setSearchInput } = useSearch();

  // This effect has been moved to the SearchParamsHandler component

  // Function to scroll to current session when it's created
  useEffect(() => {
    if (currentSession?.ref.current && !loading) {
      setTimeout(() => {
        currentSession.ref.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentSession, loading]);

  // When error dialog is closed, set the failed query to the input
  useEffect(() => {
    if (!errorDialogOpen && failedQuery) {
      setInputValue(failedQuery);

      // Scroll to the search bar if we have results already
      if (querySessions.length > 0 && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [errorDialogOpen, failedQuery, querySessions.length]);

  useEffect(() => {
    if (searchInput) {
      // Find the input element and set its value
      const inputElement = document.querySelector('textarea[placeholder="Ask a question..."]') as HTMLTextAreaElement;
      if (inputElement) {
        inputElement.value = searchInput;
        // Focus the input
        inputElement.focus();
        // Clear the search input
        setSearchInput("");
      }
    }
  }, [searchInput, setSearchInput]);

  const handleClear = () => {
    setInputValue("");
    setSubmitted(false);
    setQuerySessions([]);
    setCurrentSession(null);
    setFailedQuery("");
    setConversationHistory([]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    // Save the query in case it fails
    const queryText = inputValue;
    
    // Clear input for next query immediately
    setInputValue("");

    // Add user's query to conversation history
    setConversationHistory(prev => [
      ...prev,
      { type: 'user', content: queryText }
    ]);

    // Clear the failed query
    setFailedQuery("");

    // Show loading state for both initial and follow-up queries
    setLoading(true);
    setLoadingStep(1);

    // If this is a follow-up query, scroll to the results area
    if (submitted) {
      if (searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }

    try {
      // Prepare context from previous conversation for follow-up queries
      const context = conversationHistory.length > 0
        ? { previousQueries: conversationHistory }
        : undefined;

      // First try to generate the SQL queries
      const generatedQueries = await generateQuery(queryText, context);

      // Create a new session ID
      const sessionId = Date.now().toString();

      // Create a ref for this session
      const sessionRef = createRef<HTMLDivElement>();

      // Show that we've submitted something
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
        selectedQueryIndex: 0,
        ref: sessionRef
      };

      // Set as current session and add to sessions list
      setCurrentSession(newSession);
      setQuerySessions(prev => [...prev, newSession]);

      // Add system response to conversation history
      setConversationHistory(prev => [
        ...prev,
        {
          type: 'system',
          content: `Generated ${generatedQueries.length} SQL ${generatedQueries.length === 1 ? 'query' : 'queries'}`,
          session: newSession
        }
      ]);

      // Execute the SQL queries
      setLoadingStep(2);
      const results = await runGenerateSQLQuery(generatedQueries);

      // Update the session with results
      const sessionWithResults = { ...newSession, queryResults: results };
      setCurrentSession(sessionWithResults);
      setQuerySessions(prev => prev.map(session =>
        session.id === sessionId ? sessionWithResults : session
      ));

      // Update conversation history with results
      setConversationHistory(prev =>
        prev.map(item =>
          (item.type === 'system' && item.session?.id === sessionId)
            ? { ...item, session: sessionWithResults }
            : item
        )
      );

      // Set loading to false now that we have results
      setLoading(false);

      // Generate chart config for the query results
      const config = await generateChartConfig(results, queryText);

      // Update the session with chart config
      const sessionWithChart = { ...sessionWithResults, chartConfig: config };
      setCurrentSession(sessionWithChart);
      setQuerySessions(prev => prev.map(session =>
        session.id === sessionId ? sessionWithChart : session
      ));

      // Update conversation history with chart config
      setConversationHistory(prev =>
        prev.map(item =>
          (item.type === 'system' && item.session?.id === sessionId)
            ? { ...item, session: sessionWithChart }
            : item
        )
      );

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

        // Final update to conversation history
        setConversationHistory(prev =>
          prev.map(item =>
            (item.type === 'system' && item.session?.id === sessionId)
              ? { ...item, session: completeSession }
              : item
          )
        );
      } catch (error) {
        console.error("Failed to generate insights:", error);
        toast.error("Failed to generate insights. We'll keep the charts and tables ready for you.");
      } finally {
        setLoadingInsights(false);
      }

    } catch (error) {
      console.error("Failed to execute query:", error);

      // Stop loading states
      setLoading(false);

      // Store the failed query
      setFailedQuery(queryText);

      // Show error dialog
      setErrorMessage("We couldn't process your query. Please try rephrasing or simplifying your question.");
      setErrorDialogOpen(true);

      // Add error to conversation history
      setConversationHistory(prev => [
        ...prev,
        { type: 'system', content: 'Error processing query' }
      ]);
    }
  };

  const handleSuggestionClick = (suggestion: string, predefinedSql?: string) => {
    // If we have predefined SQL, bypass the normal query generation
    if (predefinedSql) {
      processPredefinedQuery(suggestion, predefinedSql);
    } else {
      // Store the suggestion for processing but don't set it in the input field
      const queryToProcess = suggestion;
      setTimeout(() => {
        // Call handleSubmit with the suggestion directly
        const originalInputValue = inputValue;
        setInputValue(queryToProcess);
        handleSubmit();
        // The input will be cleared by handleSubmit, so we don't need to restore
      }, 100);
    }
  };

  // New function to handle predefined SQL queries
  const processPredefinedQuery = async (queryText: string, predefinedSql: string) => {
    if (!queryText.trim() || !predefinedSql.trim()) return;
    
    // Clear input for next query immediately
    setInputValue("");

    // Show loading state
    setLoading(true);
    setLoadingStep(1);

    // If this is a follow-up query, scroll to the results area
    if (submitted) {
      if (searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }

    try {
      // Add user's query to conversation history
      setConversationHistory(prev => [
        ...prev,
        { type: 'user', content: queryText }
      ]);

      // Create a new session ID
      const sessionId = Date.now().toString();
      const sessionRef = createRef<HTMLDivElement>();

      // Create predefined query object - we're directly using the predefined SQL
      const predefinedQueries: SqlQuery[] = [
        {
          queryName: "Predefined Query",
          queryDescription: "This is a predefined query from the suggested queries list",
          sql: predefinedSql
        }
      ];

      // Show that we've submitted something
      setSubmitted(true);

      // Create initial session object
      const newSession: QuerySession = {
        id: sessionId,
        userQuery: queryText,
        timestamp: new Date(),
        sqlQueries: predefinedQueries,
        queryResults: [],
        chartConfig: null,
        insights: null,
        selectedQueryIndex: 0,
        ref: sessionRef
      };

      // Set as current session and add to sessions list
      setCurrentSession(newSession);
      setQuerySessions(prev => [...prev, newSession]);

      // Add system response to conversation history
      setConversationHistory(prev => [
        ...prev,
        {
          type: 'system',
          content: `Using predefined SQL query`,
          session: newSession
        }
      ]);

      // Execute the SQL query
      setLoadingStep(2);
      const results = await runGenerateSQLQuery(predefinedQueries);

      // Update the session with results
      const sessionWithResults = { ...newSession, queryResults: results };
      setCurrentSession(sessionWithResults);
      setQuerySessions(prev => prev.map(session =>
        session.id === sessionId ? sessionWithResults : session
      ));

      // Update conversation history with results
      setConversationHistory(prev =>
        prev.map(item =>
          (item.type === 'system' && item.session?.id === sessionId)
            ? { ...item, session: sessionWithResults }
            : item
        )
      );

      // Set loading state to false
      setLoading(false);

      // Generate chart config for the query results
      const config = await generateChartConfig(results, queryText);

      // Update the session with chart config
      const sessionWithChart = { ...sessionWithResults, chartConfig: config };
      setCurrentSession(sessionWithChart);
      setQuerySessions(prev => prev.map(session =>
        session.id === sessionId ? sessionWithChart : session
      ));

      // Update conversation history with chart config
      setConversationHistory(prev =>
        prev.map(item =>
          (item.type === 'system' && item.session?.id === sessionId)
            ? { ...item, session: sessionWithChart }
            : item
        )
      );

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

        // Final update to conversation history
        setConversationHistory(prev =>
          prev.map(item =>
            (item.type === 'system' && item.session?.id === sessionId)
              ? { ...item, session: completeSession }
              : item
          )
        );
      } catch (error) {
        console.error("Failed to generate insights:", error);
        toast.error("Failed to generate insights. We'll keep the charts and tables ready for you.");
      } finally {
        setLoadingInsights(false);
      }

    } catch (error) {
      console.error("Failed to execute predefined query:", error);
      
      // Stop loading states
      setLoading(false);
      
      // Show error dialog
      setErrorMessage("We couldn't process the predefined query. Please try a different question.");
      setErrorDialogOpen(true);
      
      // Add error to conversation history
      setConversationHistory(prev => [
        ...prev,
        { type: 'system', content: 'Error processing predefined query' }
      ]);
    }
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

    // Update conversation history
    setConversationHistory(prev =>
      prev.map(item =>
        (item.type === 'system' && item.session?.id === sessionId)
          ? {
            ...item,
            session: {
              ...item.session,
              selectedQueryIndex: index
            }
          }
          : item
      )
    );
  };

  // Handle error dialog close
  const handleErrorDialogClose = () => {
    setErrorDialogOpen(false);
  };

  // Toggle SQL details visibility for a session
  const toggleSqlDetails = (sessionId: string) => {
    setExpandedSqlSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
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
    
    // Get the expanded state for this session
    const showSqlDetails = expandedSqlSessions[session.id] || false;

    return (
      <div key={session.id} ref={session.ref} className="mb-12 pb-12 border-b border-border last:border-b-0">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{session.timestamp.toLocaleString()}</span>
        </div>

        {/* Original query display */}
        <div className="mb-4 bg-muted/30 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground">Query:</div>
          <div className="font-medium">{session.userQuery}</div>
        </div>

        {/* Only show SQL details and results when not loading */}
        {isCurrentlyLoading ? (
          <QueryProcessing step={loadingStep} question={session.userQuery} />
        ) : (
          <>
            {/* Only show SQL section when not loading */}
            {session.sqlQueries.length > 0 && (
              <>
                {/* SQL Query Toggle Button */}
                <div className="mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleSqlDetails(session.id)}
                    className="text-xs flex items-center gap-2"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {showSqlDetails ? "Hide SQL Details" : "Show SQL Details"}
                  </Button>
                </div>
                
                {/* SQL Query Details (collapsible) */}
                {showSqlDetails && (
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
              </>
            )}

            {/* Results or no results message */}
            {activeQueryResults.length === 0 ? (
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
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-background flex items-start justify-center p-0 sm:p-8 min-h-screen">
      {/* Wrap SearchParamsHandler in Suspense boundary */}
      <Suspense fallback={null}>
        <SearchParamsHandler setInputValue={setInputValue} />
      </Suspense>
      
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

                        {/* Only show the search bar and suggested queries after loading is complete */}
                        {!loading && (
                          <div
                            ref={searchInputRef}
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
                            
                            {/* Display suggested queries again */}
                            <div className="mt-8">
                              <SuggestedQueries
                                handleSuggestionClick={handleSuggestionClick}
                              />
                            </div>
                          </div>
                        )}
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
