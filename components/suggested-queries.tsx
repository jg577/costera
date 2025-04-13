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
      desktop: "Compare sales of different menu items last quarter",
      mobile: "Menu sales comparison",
    },
    {
      desktop: "Which staff have the highest productivity?",
      mobile: "Staff productivity",
    },
    {
      desktop: "Show the distribution of restaurant visits by day of week",
      mobile: "Weekly visitors",
    },
    {
      desktop: "Compare revenue vs. food costs for each menu item",
      mobile: "Menu item profitability",
    },
    {
      desktop: "What were our ingredient costs last month?",
      mobile: "Ingredient costs",
    },
    {
      desktop: "Show me sales trends for seasonal vs. regular menu items",
      mobile: "Seasonal vs. regular",
    },
    {
      desktop: "Compare efficiency between different shifts",
      mobile: "Shift efficiency",
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
          12 Bones Smokehouse and Brewing Analytics
        </h2>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg mb-6">
        <p className="text-md">
          <span className="font-semibold">Powered by Luna</span> – Your intelligent assistant that transforms your questions into valuable business insights. Just ask in plain English and get actionable data instantly.
        </p>
      </div>

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
          <li>Ask specific questions about your restaurant operations or sales</li>
          <li>Include timeframes like &ldquo;this quarter&rdquo; or &ldquo;last month&rdquo;</li>
          <li>Specify menu items, daily specials, or customer preferences</li>
          <li>Try asking for comparisons between different metrics or time periods</li>
        </ul>
      </div>
    </motion.div>
  );
};
