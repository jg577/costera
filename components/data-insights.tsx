import { Insights } from "@/lib/types";
import { AlertCircle, ArrowUp, ArrowDown, Shuffle, Minus, TrendingUp, TrendingDown, Link2 } from "lucide-react";

export function DataInsights({ insights }: { insights: Insights | null }) {
    if (!insights) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <p className="text-muted-foreground">No insights available yet.</p>
            </div>
        );
    }

    const getImportanceBadgeClass = (importance: string) => {
        switch (importance) {
            case "high":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            case "medium":
                return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
            case "low":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
        }
    };

    const getRelevanceBadgeClass = (relevance: string) => {
        switch (relevance) {
            case "primary":
                return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
            case "secondary":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
        }
    };

    const getTrendIcon = (direction: string) => {
        switch (direction) {
            case "increasing":
                return <ArrowUp className="h-4 w-4 text-emerald-500" />;
            case "decreasing":
                return <ArrowDown className="h-4 w-4 text-red-500" />;
            case "fluctuating":
                return <Shuffle className="h-4 w-4 text-amber-500" />;
            case "stable":
                return <Minus className="h-4 w-4 text-blue-500" />;
            default:
                return null;
        }
    };

    const getCorrelationIcon = (strength: string) => {
        switch (strength) {
            case "strong":
                return <TrendingUp className="h-4 w-4 text-emerald-500" />;
            case "moderate":
                return <TrendingUp className="h-4 w-4 text-blue-500" />;
            case "weak":
                return <TrendingDown className="h-4 w-4 text-gray-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 pt-2">
            {/* Summary */}
            <div>
                <h3 className="text-lg font-semibold">Summary</h3>
                <p className="mt-2 text-muted-foreground">{insights.summary}</p>
            </div>

            {/* Key Findings */}
            <div>
                <h3 className="text-lg font-semibold">Key Findings</h3>
                <div className="mt-3 space-y-4">
                    {insights.keyFindings.map((finding, index) => (
                        <div key={index} className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{finding.title}</h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${getImportanceBadgeClass(finding.importance)}`}>
                                    {finding.importance}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{finding.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cross-Query Insights */}
            {insights.crossQueryInsights && insights.crossQueryInsights.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold">Cross-Data Relationships</h3>
                    <div className="mt-3 space-y-4">
                        {insights.crossQueryInsights.map((insight, index) => (
                            <div key={index} className="border border-border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Link2 className="h-4 w-4 text-indigo-500" />
                                        <h4 className="font-medium">{insight.title}</h4>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getRelevanceBadgeClass(insight.relevance)}`}>
                                        {insight.relevance}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{insight.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trends */}
            {insights.trends && insights.trends.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold">Trends</h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.trends.map((trend, index) => (
                            <div key={index} className="border border-border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    {getTrendIcon(trend.direction)}
                                    <h4 className="font-medium">{trend.variable}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">{trend.description}</p>
                                <div className="mt-2">
                                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                                        {trend.direction}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Correlations */}
            {insights.correlations && insights.correlations.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold">Correlations</h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.correlations.map((correlation, index) => (
                            <div key={index} className="border border-border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    {getCorrelationIcon(correlation.strength)}
                                    <h4 className="font-medium">{correlation.variables.join(" & ")}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">{correlation.relationship}</p>
                                <div className="mt-2">
                                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                                        {correlation.strength}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Anomalies */}
            {insights.anomalies && insights.anomalies.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold">Anomalies</h3>
                    <div className="mt-3 space-y-4">
                        {insights.anomalies.map((anomaly, index) => (
                            <div key={index} className="border border-border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <h4 className="font-medium">Anomaly Detected</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
                                <div>
                                    <h5 className="text-sm font-medium mb-1">Possible Explanations:</h5>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                                        {anomaly.possibleExplanations.map((explanation, i) => (
                                            <li key={i}>{explanation}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommended Actions */}
            <div>
                <h3 className="text-lg font-semibold">Recommended Actions</h3>
                <ul className="mt-3 space-y-2">
                    {insights.recommendedActions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2 py-2">
                            <span className="bg-primary/10 text-primary flex items-center justify-center h-6 w-6 rounded-full text-sm font-medium">
                                {index + 1}
                            </span>
                            <span className="text-muted-foreground">{action}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
} 