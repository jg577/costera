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
  ];

  return (
    <motion.div
      key="suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
    >
      <div className="flex items-center mb-4">
        <LightbulbIcon className="h-5 w-5 mr-2 text-primary" />
        <h2 className="text-lg font-medium text-foreground">
          Suggested Questions
        </h2>
      </div>
      <div className="container-box p-4 mb-4">
        <p className="text-sm text-muted-foreground mb-3">
          Try one of these sample questions to explore your data:
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestionQueries.map((suggestion, index) => (
            <Button
              key={index}
              className={`${index > 5 ? "hidden sm:inline-flex" : ""} friendly-button text-sm`}
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
    </motion.div>
  );
};
