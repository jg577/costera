"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Severity = "good" | "neutral" | "bad";

interface NewsItem {
    id: string;
    title: string;
    description: string;
    severity: Severity | number;
    date: string;      // New field from backend
    timestamp: string;
    imageUrl?: string;
}

// Mock data for development
const mockNewsItems: NewsItem[] = [
    {
        id: "1",
        title: "System Update",
        description: "New features have been deployed to improve performance.",
        severity: "neutral",
        date: "2024-04-25",
        timestamp: "2024-04-25T10:00:00Z",
        imageUrl: "https://picsum.photos/800/400"
    },
    {
        id: "2",
        title: "High Traffic Alert",
        description: "Unusual spike in user activity detected.",
        severity: "neutral",
        date: "2024-04-25",
        timestamp: "2024-04-25T09:30:00Z"
    },
    { 
        id: "3",
        title: "Critical Error",
        description: "Database connection issues reported in production.",
        severity: "bad",
        date: "2024-04-24",
        timestamp: "2024-04-24T09:00:00Z"
    },
    {
        id: "4",
        title: "Deployment Success",
        description: "New version successfully deployed to all regions.",
        severity: "good",
        date: "2024-04-23",
        timestamp: "2024-04-23T08:30:00Z",
        imageUrl: "https://picsum.photos/800/400"
    }
];

const severityColors = {
    good: "bg-green-500",
    neutral: "bg-amber-500",
    bad: "bg-red-500"
};

const severityBorderColors = {
    good: "border-green-500",
    neutral: "border-amber-500",
    bad: "border-red-500"
};

const severityTextColors = {
    good: "text-green-700",
    neutral: "text-amber-700",
    bad: "text-red-700"
};

// Group news items by date
const groupByDate = (items: NewsItem[]): Map<string, NewsItem[]> => {
    const grouped = new Map<string, NewsItem[]>();
    
    items.forEach(item => {
        const dateKey = item.date;
        
        if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
        }
        grouped.get(dateKey)?.push(item);
    });
    
    return grouped;
};

// Map numeric severity to Severity type
const mapSeverity = (severityValue: Severity | number): Severity => {
    if (typeof severityValue === 'string') {
        return severityValue as Severity;
    }
    
    // Map numeric values (-1, 0, 1) to severity types
    switch (severityValue) {
        case -1: return "bad";
        case 0: return "neutral";
        case 1: return "good";
        default: return "neutral";
    }
};

// Helper function to format date with day of week
const formatDateWithDay = (dateString: string): string => {
    // Parse as local date, not UTC
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // JS months are 0-based
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[date.getDay()];
    const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${dayOfWeek}, ${formattedDate}`;
};

// Helper function to get numeric severity value
const getSeverityValue = (severity: Severity | number): number => {
    if (typeof severity === 'number') {
        return severity;
    }
    
    // Map string severity to numeric value
    switch (severity) {
        case "bad": return -1;
        case "neutral": return 0;
        case "good": return 1;
        default: return 0;
    }
};

export function Newsfeed() {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Use a very large limit to get all news items (effectively no limit)
                const response = await fetch('https://luna-backend-gamma.vercel.app/api/news?limit=1000');
                const data = await response.json();
                
                // Just use the data as-is from the API
                setNewsItems(data);
            } catch (error) {
                console.error('Error fetching news:', error);
                // Fall back to mock data
                setNewsItems(mockNewsItems);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const handleItemClick = (description: string) => {
        // Set the input value in the URL state
        router.push(`/?input=${encodeURIComponent(description)}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Sort news items by timestamp (newest first)
    const sortedItems = [...newsItems].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Group items by date
    const groupedItems = groupByDate(sortedItems);
    console.log(groupedItems);
    
    // Convert to array of [dateString, items], sort by date (newest first), and sort items by severity
    const groupedItemsArray = Array.from(groupedItems.entries())
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        .map(([date, items]) => {
            // Sort items by severity (from most severe to least severe)
            const sortedByPriority = [...items].sort((a, b) => 
                getSeverityValue(a.severity) - getSeverityValue(b.severity)
            );
            return [date, sortedByPriority] as [string, NewsItem[]];
        });

    return (
        <div className="space-y-4">
            {groupedItemsArray.map(([dateString, items]) => (
                <div key={dateString} className="space-y-3 mb-6 pb-4 last:border-b-0">
                    <h3 className="text-lg font-bold text-gray-800 py-2 px-3 border-l-4 border-blue-600 pl-3 bg-blue-50 rounded-r-md shadow-sm mb-3">
                        {formatDateWithDay(dateString)}
                        <span className="ml-2 text-blue-600">({items.length} alerts)</span>
                    </h3>
                    <div className="space-y-2">
                        {items.map((item: NewsItem) => {
                            const mappedSeverity = mapSeverity(item.severity);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item.description)}
                                    className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 ${severityBorderColors[mappedSeverity]} transform hover:-translate-y-px`}
                                >
                                    <div className="p-3.5 flex flex-row items-center">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className={`w-2.5 h-2.5 rounded-full ${severityColors[mappedSeverity]}`} />
                                                <h2 className="text-base font-semibold text-gray-900">{item.title}</h2>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-normal break-words">{item.description}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className={`text-xs font-medium ${severityTextColors[mappedSeverity]} inline-block px-2.5 py-0.5 rounded-full bg-gray-100`}>
                                                    {mappedSeverity.charAt(0).toUpperCase() + mappedSeverity.slice(1)}
                                                </div>
                                            </div>
                                        </div>
                                        {item.imageUrl && (
                                            <div className="relative h-20 w-28 ml-4 rounded-md overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}