import { useState } from "react";
import { Button } from "./ui/button";
import { QueryWithTooltips } from "./ui/query-with-tooltips";
import { explainQuery } from "@/app/actions";
import { QueryExplanation, SqlQuery } from "@/lib/types";
import { CircleHelp, Loader2, FileText } from "lucide-react";

export const QueryViewer = ({
  activeQuery,
  activeQueryName,
  inputValue,
}: {
  activeQuery: string;
  activeQueryName?: string;
  inputValue: string;
}) => {
  const activeQueryCutoff = 100;

  const [queryExplanations, setQueryExplanations] = useState<
    QueryExplanation[] | null
  >();
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [queryExpanded, setQueryExpanded] = useState(activeQuery.length > activeQueryCutoff);

  const handleExplainQuery = async () => {
    setQueryExpanded(true);
    setLoadingExplanation(true);
    // Create a mock query object to pass to explainQuery
    const queryObj: SqlQuery = {
      queryName: activeQueryName || "Query",
      queryDescription: "",
      sql: activeQuery
    };
    const { explanations } = await explainQuery(inputValue, [queryObj]);

    // Find the explanation for this specific query
    const relevantExplanation = explanations.find(exp =>
      exp.queryName === activeQueryName || exp.queryName === "Query"
    );

    // If found, use its sections, otherwise use an empty array
    setQueryExplanations(relevantExplanation?.sections || []);
    setLoadingExplanation(false);
  };

  if (activeQuery.length === 0) return null;

  return (
    <div className="mb-6 relative">
      <div className="p-4 mb-4 border-2 border-muted rounded-md overflow-x-auto w-full">
        {activeQueryName && (
          <div className="mb-2 flex items-center text-primary">
            <FileText className="h-4 w-4 mr-2" />
            <span className="font-medium">{activeQueryName}</span>
          </div>
        )}
        <div className="code-text text-sm mt-1 overflow-x-auto">
          {queryExpanded ? (
            queryExplanations && queryExplanations.length > 0 ? (
              <>
                <QueryWithTooltips
                  query={activeQuery}
                  queryExplanations={queryExplanations}
                />
                <p className="mt-4 text-xs text-muted-foreground border-t border-border pt-2">
                  Hover over highlighted parts of the query for explanations.
                </p>
              </>
            ) : (
              <div className="flex justify-between items-start">
                <pre className="text-foreground whitespace-pre-wrap overflow-x-auto break-words max-w-full">{activeQuery}</pre>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExplainQuery}
                  className="h-fit px-2 py-1 hover:bg-secondary/80 hidden sm:inline-block text-xs ml-2 flex-shrink-0"
                  aria-label="Explain query"
                  disabled={loadingExplanation}
                >
                  {loadingExplanation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CircleHelp className="h-4 w-4 mr-1" />
                  )}
                  Explain
                </Button>
              </div>
            )
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {activeQuery.slice(0, activeQueryCutoff)}
                {activeQuery.length > activeQueryCutoff ? "..." : ""}
              </span>
              {activeQuery.length > activeQueryCutoff && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQueryExpanded(true)}
                  className="text-xs bg-secondary/70 hover:bg-secondary/90 flex-shrink-0 ml-2"
                >
                  Show full
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
