import { Config, Result, QueryResult } from "@/lib/types";

/**
 * Consolidates data from multiple query results into a single dataset 
 * based on the consolidation method specified in the chart configuration
 */
export function consolidateQueryData(
    queryResults: QueryResult[],
    chartConfig: Config
): Result[] {
    if (!chartConfig.isConsolidated || !chartConfig.consolidation) {
        // Return data from the first query if not consolidated
        return queryResults[0]?.data || [];
    }

    const { method, keyField, valueFields, sourceQueries } = chartConfig.consolidation;

    // Filter to only include queries specified in sourceQueries
    const relevantQueries = sourceQueries
        ? queryResults.filter(qr => sourceQueries.includes(qr.queryName))
        : queryResults;

    if (relevantQueries.length === 0) {
        return [];
    }

    switch (method) {
        case "merge":
            return mergeQueryData(relevantQueries, keyField);

        case "stack":
            return stackQueryData(relevantQueries, valueFields);

        case "join":
            return joinQueryData(relevantQueries, keyField, valueFields);

        default:
            // Default to simple concatenation if method not recognized
            return relevantQueries.flatMap(qr => qr.data);
    }
}

/**
 * Merges data from multiple queries by combining rows with the same key field value
 */
function mergeQueryData(
    queryResults: QueryResult[],
    keyField?: string
): Result[] {
    if (!keyField) {
        return queryResults.flatMap(qr => qr.data);
    }

    // Create a map to hold merged results
    const mergedMap = new Map<string, Result>();

    // Process each query
    queryResults.forEach((qr, queryIndex) => {
        const queryName = qr.queryName;

        qr.data.forEach(row => {
            const keyValue = String(row[keyField]);

            if (!keyValue) return; // Skip rows without the key field

            if (!mergedMap.has(keyValue)) {
                // Initialize with the key field and query name for tracking
                mergedMap.set(keyValue, {
                    [keyField]: row[keyField],
                    __sources: [queryName]
                });
            }

            // Get the existing merged row
            const mergedRow = mergedMap.get(keyValue)!;

            // Add source to tracking array if not already present
            if (!mergedRow.__sources.includes(queryName)) {
                mergedRow.__sources.push(queryName);
            }

            // Add all other fields with a prefix to avoid collisions
            Object.entries(row).forEach(([field, value]) => {
                if (field !== keyField) {
                    const prefixedField = `${queryName.replace(/\s+/g, '_')}_${field}`;
                    mergedRow[prefixedField] = value;

                    // Also store with original field name if not already present
                    if (mergedRow[field] === undefined) {
                        mergedRow[field] = value;
                    }
                }
            });
        });
    });

    return Array.from(mergedMap.values());
}

/**
 * Stacks data from multiple queries by appending all rows with a source field
 */
function stackQueryData(
    queryResults: QueryResult[],
    valueFields?: string[]
): Result[] {
    const stackedData: Result[] = [];

    queryResults.forEach(qr => {
        const queryName = qr.queryName;

        qr.data.forEach(row => {
            const newRow: Result = {
                ...row,
                __source: queryName
            };

            // Filter to only include specified value fields if provided
            if (valueFields && valueFields.length > 0) {
                const filteredRow: Result = { __source: queryName };

                valueFields.forEach(field => {
                    if (field in row) {
                        filteredRow[field] = row[field];
                    }
                });

                stackedData.push(filteredRow);
            } else {
                stackedData.push(newRow);
            }
        });
    });

    return stackedData;
}

/**
 * Joins data from multiple queries based on a common key field
 */
function joinQueryData(
    queryResults: QueryResult[],
    keyField?: string,
    valueFields?: string[]
): Result[] {
    if (!keyField || queryResults.length < 2) {
        return queryResults.flatMap(qr => qr.data);
    }

    // Start with data from the first query
    const baseQuery = queryResults[0];
    const joinedData = [...baseQuery.data];

    // For each additional query, join its data to the base
    for (let i = 1; i < queryResults.length; i++) {
        const secondaryQuery = queryResults[i];
        const secondaryQueryName = secondaryQuery.queryName.replace(/\s+/g, '_');

        // Create lookup map for the secondary query data
        const secondaryDataMap = new Map<string, Result>();
        secondaryQuery.data.forEach(row => {
            const keyValue = String(row[keyField]);
            if (keyValue) {
                secondaryDataMap.set(keyValue, row);
            }
        });

        // Join secondary data to each row of the joined result
        joinedData.forEach(row => {
            const keyValue = String(row[keyField]);
            if (keyValue && secondaryDataMap.has(keyValue)) {
                const matchingRow = secondaryDataMap.get(keyValue)!;

                // Add all fields from the secondary query with a prefix
                Object.entries(matchingRow).forEach(([field, value]) => {
                    if (field !== keyField) {
                        // Use prefix for fields that might conflict
                        const prefixedField = `${secondaryQueryName}_${field}`;
                        row[prefixedField] = value;

                        // Also store field with original name if not already present
                        if (valueFields?.includes(field) && row[field] === undefined) {
                            row[field] = value;
                        }
                    }
                });
            }
        });
    }

    return joinedData;
}

/**
 * Creates a consistent color scheme for consolidated data visualization
 */
export function generateConsolidatedColorScheme(
    queryResults: QueryResult[],
    chartConfig: Config
): Record<string, string> {
    const colors = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
        "hsl(var(--chart-6))",
        "hsl(var(--chart-7))",
        "hsl(var(--chart-8))",
    ];

    const colorMap: Record<string, string> = {};

    if (chartConfig.isConsolidated && chartConfig.consolidation) {
        const { sourceQueries } = chartConfig.consolidation;

        // Assign colors to each source query
        (sourceQueries || queryResults.map(qr => qr.queryName)).forEach((queryName, index) => {
            colorMap[queryName] = colors[index % colors.length];

            // If this is a join or merge, also add entries for prefixed fields
            const prefixedName = queryName.replace(/\s+/g, '_');
            colorMap[prefixedName] = colors[index % colors.length];
        });
    }

    return colorMap;
} 