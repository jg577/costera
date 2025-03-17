import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { LightbulbIcon } from "lucide-react";

export const SuggestedQueries = ({
  handleSuggestionClick,
}: {
  handleSuggestionClick: (suggestion: string) => void;
}) => {
  const suggestionQueries = [
    {
      desktop: "Show total hours worked by each employee this month",
      mobile: "Hours by employee",
    },
    {
      desktop: "Compare average daily hours worked at different locations",
      mobile: "Hours by location",
    },
    {
      desktop: "Which job titles have the highest payable hours?",
      mobile: "Top job hours",
    },
    {
      desktop: "Show the distribution of work hours by day of week",
      mobile: "Weekly pattern",
    },
    {
      desktop: "Compare payable vs total hours for each employee",
      mobile: "Payable vs total",
    },
    {
      desktop: "What were our food costs last month?",
      mobile: "Food costs",
    },
    {
      desktop: "Show me employee tips by day of week",
      mobile: "Tips by day",
    },
    {
      desktop: "Compare food costs between different categories",
      mobile: "Cost categories",
    },
  ];

  return (
    <motion.div
      key="suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto pt-4"
    >
      <div className="flex items-center mb-6">
        <LightbulbIcon className="h-5 w-5 mr-2 text-primary" />
        <h2 className="text-lg font-medium text-foreground">
          Welcome to Luna
        </h2>
      </div>

      <p className="text-md mb-6">
        Ask any question about your restaurant data to get insights with natural language.
        Luna can analyze time entries, food costs, and inventory data to help you make better decisions.
      </p>

      <div className="container-box p-4 mb-6">
        <p className="text-sm text-muted-foreground mb-3">
          Try one of these sample questions to explore your data:
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestionQueries.map((suggestion, index) => (
            <Button
              key={index}
              className={`friendly-button text-sm`}
              type="button"
              variant="outline"
              onClick={() => handleSuggestionClick(suggestion.desktop)}
            >
              <span className="sm:hidden">{suggestion.mobile}</span>
              <span className="hidden sm:inline">{suggestion.desktop}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="container-box p-4 mb-4 border-l-4 border-primary">
        <h3 className="text-md font-medium mb-2">Tips for best results</h3>
        <ul className="list-disc pl-5 text-sm space-y-2">
          <li>Ask specific questions about your restaurant data</li>
          <li>Include timeframes like &ldquo;this month&rdquo; or &ldquo;last week&rdquo;</li>
          <li>Specify employee roles, food categories, or locations</li>
          <li>Try asking for comparisons between different data points</li>
        </ul>
      </div>
    </motion.div>
  );
};
