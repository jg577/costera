"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Severity = "good" | "neutral" | "bad";

interface NewsItem {
    id: string;
    title: string;
    description: string;
    severity: Severity;
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
    neutral: "bg-yellow-500",
    bad: "bg-red-500"
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
    console.log("Sorted news items:", sortedItems);
    
    // Group items by date
    const groupedItems = groupByDate(sortedItems);
    console.log(groupedItems);
    
    // Convert to array of [dateString, items] and sort by date (newest first)
    const groupedItemsArray = Array.from(groupedItems.entries())
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));

    return (
        <div className="space-y-6">
            {groupedItemsArray.map(([dateString, items]) => (
                <div key={dateString} className="space-y-4 mb-8 border-b pb-4 last:border-b-0">
                    <h3 className="text-xl font-bold text-gray-800 py-3 px-1 border-l-4 border-gray-500 pl-2">
                        {dateString} ({items.length} items)
                    </h3>
                    
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleItemClick(item.description)}
                            className="bg-gray-50 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                        >
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-3 h-3 rounded-full ${severityColors[item.severity]}`} />
                                    <h2 className="text-base font-medium text-gray-900">{item.title}</h2>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                <div className="text-xs text-gray-500 mb-3">
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {item.imageUrl && (
                                    <div className="relative h-40 w-full">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
} 