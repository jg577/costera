"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import {
  generateChartConfig,
  generateQuery,
  runGenerateSQLQuery,
} from "./actions";
import { Config, SqlQuery, QueryResult, Insights } from "@/lib/types";
import { useSearch } from "@/lib/search-context";
import { Results } from "@/components/results";
import { QueryViewer } from "@/components/query-viewer";

interface QuerySession {
  id: string;
  userQuery: string;
  sqlQueries: SqlQuery[];
  queryResults: QueryResult[];
  chartConfig: Config | null;
  insights: Insights | null;
  selectedQueryIndex: number;
}

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

const suggestedQueries = [
    {
        title: "Sales Analysis",
        queries: [
            "Which products are the top sellers?",
            "Show me the sales trend over the past year.",
            "What were the total sales for the last quarter?",
        ],
    },
    {
        title: "Cost Optimization",
        queries: [
            "What are our biggest operational costs?",
            "Compare costs between Q1 and Q2.",
            "Identify potential areas for cost savings.",
        ],
    },
];

export default function Page() {
  const [inputValue, setInputValue] = useState("");
  const [querySessions, setQuerySessions] = useState<QuerySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { searchInput, setSearchInput } = useSearch();
  const lastSessionRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     if (searchInput) {
       setInputValue(searchInput);
       handleSubmit(undefined, searchInput);
       setSearchInput("");
     }
   }, [searchInput, setSearchInput]);

   useEffect(() => {
    lastSessionRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [querySessions]);

   const handleSuggestionClick = (query: string) => {
     setInputValue(query);
     handleSubmit(undefined, query);
   };

   const handleSubmit = async (e?: React.FormEvent, queryOverride?: string) => {
     if (e) e.preventDefault();
     const currentQuery = queryOverride || inputValue;
     if (!currentQuery.trim()) return;

     setLoading(true);
     setError(null);

     try {
       const sqlQueries: SqlQuery[] = await generateQuery(currentQuery);

       const queryResults: QueryResult[] = await runGenerateSQLQuery(sqlQueries);

       const chartConfig: Config | null = await generateChartConfig(
         queryResults,
         currentQuery
       );

       setQuerySessions(prev => [...prev, {
         id: new Date().toISOString(),
         userQuery: currentQuery,
         sqlQueries,
         queryResults,
         chartConfig,
         insights: null, 
         selectedQueryIndex: 0,
       }]);

     } catch (err: any) {
       setError(err.message || "An unexpected error occurred.");
       toast.error(err.message || "An unexpected error occurred.");
     } finally {
       setLoading(false);
       if (!queryOverride) {
        setInputValue("");
       }
     }
   };

    return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsHandler setInputValue={setInputValue} />
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
        
        <main className="flex-grow flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 pt-16">
            <div className="w-full max-w-5xl mx-auto">
                
                {querySessions.length === 0 ? (
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                             <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                12 Bones Smokehouse and Brewing
                            </span>
                        </h1>
                        <p className="text-lg text-gray-600 mb-10 md:mb-16">
                            Get instant insights by asking questions about your business operations and performance.
                        </p>
                    </div>
                ) : (
                    <div className="py-8 md:py-16">
                        {querySessions.map((session, index) => (
                          <div 
                            key={session.id} 
                            className="mb-12"
                            ref={index === querySessions.length - 1 ? lastSessionRef : null}
                          >
                              <h2 className="text-2xl font-semibold text-gray-800 mb-4">{session.userQuery}</h2>
                              <div className="bg-white border border-gray-200 rounded-lg p-6">
                                  <QueryViewer
                                      activeQuery={session.sqlQueries[session.selectedQueryIndex]?.sql || ""}
                                      activeQueryName={session.sqlQueries[session.selectedQueryIndex]?.queryName}
                                      inputValue={session.userQuery}
                                  />
                                  <Results
                                      results={session.queryResults[session.selectedQueryIndex]?.data || []}
                                      columns={session.queryResults[session.selectedQueryIndex]?.data.length > 0 ? Object.keys(session.queryResults[session.selectedQueryIndex].data[0]) : []}
                                      queryResults={session.queryResults}
                                      chartConfig={session.chartConfig}
                                      insights={session.insights}
                                      selectedQueryIndex={session.selectedQueryIndex}
                                  />
                              </div>
                          </div>
                        ))}
                    </div>
                )}
                
                <div className="sticky bottom-0 pb-4 sm:pb-8 pt-4 bg-gray-50/80 backdrop-blur-lg">
                    <form onSubmit={handleSubmit} className="relative">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="start a new query"
                            className="w-full text-base border border-gray-300 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 p-3 sm:p-4 pr-12 sm:pr-16"
                            rows={inputValue.split('\n').length || 1}
                            disabled={loading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || loading}
                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 sm:p-2.5 rounded-full transition-all duration-200"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                </div>

                {querySessions.length === 0 && (
                    <div className="mt-4 md:mt-12">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Suggested Queries</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestedQueries.map((category) => (
                                <div key={category.title} className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h4 className="font-bold text-gray-800 mb-3">{category.title}</h4>
                                    <div className="space-y-2">
                                        {category.queries.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => handleSuggestionClick(q)}
                                                className="w-full text-left text-blue-600 hover:underline"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                               </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </main>
      </div>
    </Suspense>
  );
}
