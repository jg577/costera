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
        timestamp: "2024-04-25T10:00:00Z",
        imageUrl: "https://picsum.photos/800/400"
    },
    {
        id: "2",
        title: "High Traffic Alert",
        description: "Unusual spike in user activity detected.",
        severity: "neutral",
        timestamp: "2024-04-25T09:30:00Z"
    },
    {
        id: "3",
        title: "Critical Error",
        description: "Database connection issues reported in production.",
        severity: "bad",
        timestamp: "2024-04-25T09:00:00Z"
    },
    {
        id: "4",
        title: "Deployment Success",
        description: "New version successfully deployed to all regions.",
        severity: "good",
        timestamp: "2024-04-25T08:30:00Z",
        imageUrl: "https://picsum.photos/800/400"
    }
];

const severityColors = {
    good: "bg-green-500",
    neutral: "bg-yellow-500",
    bad: "bg-red-500"
};

export function Newsfeed() {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchNews = async () => {
            try {
                //In production, replace with actual API call
                const response = await fetch('http://127.0.0.1:8000/api/news');
                const data = await response.json();
                setNewsItems(data);

                // // Using mock data for now
                // setNewsItems(mockNewsItems);
            } catch (error) {
                console.error('Error fetching news:', error);
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

    return (
        <div className="space-y-6">
            {newsItems.map((item) => (
                <div
                    key={item.id}
                    onClick={() => handleItemClick(item.description)}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                >
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${severityColors[item.severity]}`} />
                            <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                        </div>
                        <p className="text-gray-600 mb-4">{item.description}</p>
                        <div className="text-sm text-gray-500 mb-4">
                            {new Date(item.timestamp).toLocaleString()}
                        </div>
                        {item.imageUrl && (
                            <div className="relative h-48 w-full">
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
    );
} 