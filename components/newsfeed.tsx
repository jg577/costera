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

// Function to capitalize the first letter of each word
const capitalizeTitle = (title: string): string => {
    return title.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
};

// Group items by title category
interface GroupedCategory {
    title: string;
    items: NewsItem[];
    severity: Severity;
    date: string;
    id: string;
}

// Function to group items by category (title)
const groupByCategory = (items: NewsItem[]): GroupedCategory[] => {
    const groupedByTitle = new Map<string, NewsItem[]>();
    
    // Group items by title
    items.forEach(item => {
        const title = item.title.toLowerCase();
        if (!groupedByTitle.has(title)) {
            groupedByTitle.set(title, []);
        }
        groupedByTitle.get(title)?.push(item);
    });
    
    // Convert to array of grouped categories
    const result: GroupedCategory[] = [];
    groupedByTitle.forEach((items, title) => {
        // Get the worst severity among items
        const worstSeverity = items.reduce((worst, item) => {
            const currentSeverity = getSeverityValue(item.severity);
            return currentSeverity < worst ? currentSeverity : worst;
        }, 1);
        
        // Create a group for this category
        result.push({
            title: title,
            items: items,
            severity: mapSeverity(worstSeverity),
            date: items[0].date,
            id: `category-${title}-${items[0].date}` // Generate a unique ID for the category
        });
    });
    
    // Sort categories by severity (bad first, then neutral, then good)
    result.sort((a, b) => {
        // Convert severity to numeric value for sorting
        const severityValueA = getSeverityValue(a.severity);
        const severityValueB = getSeverityValue(b.severity);
        return severityValueA - severityValueB;
    });
    
    return result;
};

export function Newsfeed() {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUrgentOnly, setShowUrgentOnly] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<GroupedCategory | null>(null);
    const [isMobileView, setIsMobileView] = useState(false);
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
        
        // Check if we're on mobile initially
        const checkIfMobile = () => {
            setIsMobileView(window.innerWidth < 1024);
        };
        
        // Initial check
        checkIfMobile();
        
        // Listen for resize events
        window.addEventListener('resize', checkIfMobile);
        
        // Clean up
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    useEffect(() => {
        // Set the first category as selected by default if available
        if (newsItems.length > 0) {
            const groupedByDate = groupByDate(newsItems);
            const firstDateItems = groupedByDate.values().next().value;
            if (firstDateItems && firstDateItems.length > 0) {
                const categories = groupByCategory(firstDateItems);
                if (categories.length > 0) {
                    setSelectedCategory(categories[0]);
                }
            }
        }
    }, [newsItems]);

    const handleCategoryClick = (category: GroupedCategory) => {
        setSelectedCategory(category);
    };

    const handleChatAction = (description: string) => {
        // Set the input value in the URL state for chat
        router.push(`/?input=${encodeURIComponent(description)}`);
    };
    
    const closeModal = () => {
        if (isMobileView) {
            setSelectedCategory(null);
        }
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
    
    // Convert to array of [dateString, items], sort by date (newest first)
    const groupedItemsArray = Array.from(groupedItems.entries())
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
    
    // Create the details panel content
    const renderDetailsPanel = () => {
        if (!selectedCategory) return null;
        
        return (
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 h-full overflow-y-auto">
                <div>
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                            {capitalizeTitle(selectedCategory.title)}
                            {selectedCategory.items.length > 1 && 
                                <span className="ml-2 text-gray-500 text-sm">
                                    ({selectedCategory.items.length} items)
                                </span>
                            }
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${severityTextColors[selectedCategory.severity]} bg-gray-100`}>
                                {selectedCategory.severity === "bad" ? "Red" : 
                                 selectedCategory.severity === "good" ? "Green" : "Neutral"}
                            </div>
                            {isMobileView && (
                                <button 
                                    onClick={closeModal}
                                    className="ml-2 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {selectedCategory.title.toLowerCase() === "pricing opportunity" ? (
                        <div className="space-y-4 md:space-y-5">
                            {/* Sort items by severity with bad/critical first */}
                            {[...selectedCategory.items]
                                .sort((a, b) => getSeverityValue(a.severity) - getSeverityValue(b.severity))
                                .map((item) => (
                                <div 
                                    key={item.id} 
                                    className={`border rounded-lg p-3 md:p-4 hover:shadow-sm transition-all ${
                                        mapSeverity(item.severity) === "bad" ? "border-l-4 border-l-red-500" : ""
                                    }`}
                                >
                                    <h3 className="font-medium mb-2 md:text-lg">{item.description.split(',')[0]}</h3>
                                    <div className="text-sm md:text-base text-gray-700 whitespace-pre-line">{item.description}</div>
                                    <div className="mt-2 md:mt-3 flex justify-end">
                                        <button 
                                            onClick={() => handleChatAction(item.description)}
                                            className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                            Ask Luna
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : selectedCategory.items.length === 1 ? (
                        // Single item view
                        <div>
                            {selectedCategory.items[0].imageUrl && (
                                <div className="relative h-48 md:h-64 w-full mb-4 md:mb-6 rounded-md overflow-hidden">
                                    <Image
                                        src={selectedCategory.items[0].imageUrl}
                                        alt={selectedCategory.items[0].title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            
                            <div className="mb-4 md:mb-6">
                                <p className="text-gray-700 md:text-lg whitespace-pre-line">{selectedCategory.items[0].description}</p>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm md:text-base text-gray-500 mt-6">
                                <span>{formatDateWithDay(selectedCategory.items[0].date)}</span>
                                <button 
                                    onClick={() => handleChatAction(selectedCategory.items[0].description)}
                                    className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    Ask Luna
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Multiple items view for non-pricing opportunity categories
                        <div className="space-y-3 md:space-y-4">
                            {/* Sort items by severity with bad/critical first */}
                            {[...selectedCategory.items]
                                .sort((a, b) => getSeverityValue(a.severity) - getSeverityValue(b.severity))
                                .map((item) => (
                                <div 
                                    key={item.id} 
                                    className={`border rounded-lg p-3 md:p-4 hover:shadow-sm transition-all ${
                                        mapSeverity(item.severity) === "bad" ? "border-l-4 border-l-red-500" : ""
                                    }`}
                                >
                                    <p className="text-gray-700 md:text-base">{item.description}</p>
                                    <div className="mt-2 md:mt-3 flex justify-end">
                                        <button 
                                            onClick={() => handleChatAction(item.description)}
                                            className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                            Ask Luna
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 max-w-screen-xl">
            <div className="flex justify-end mb-4">
                <div className="inline-flex items-center rounded-md shadow-sm border overflow-hidden">
                    <button
                        onClick={() => setShowUrgentOnly(false)}
                        className={`px-4 py-2 text-sm font-medium ${!showUrgentOnly ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        All Alerts
                    </button>
                    <button
                        onClick={() => setShowUrgentOnly(true)}
                        className={`px-4 py-2 text-sm font-medium ${showUrgentOnly ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        Urgent Only
                    </button>
                </div>
            </div>
            
            {/* Desktop layout */}
            <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
                {/* Left Column - Date Groups and Category Titles */}
                <div className="lg:col-span-1 overflow-y-auto h-[calc(100vh-200px)] pr-2">
                    {groupedItemsArray.map(([dateString, items]) => {
                        // Group items by category
                        const categories = groupByCategory(items);
                        
                        // Filter categories if urgent only is selected
                        const filteredCategories = showUrgentOnly 
                            ? categories.filter(category => category.severity === "bad")
                            : categories;
                        
                        // Skip date group if it has no categories after filtering
                        if (filteredCategories.length === 0) return null;
                        
                        return (
                            <div key={dateString} className="mb-4">
                                <h3 className="text-base font-bold text-gray-800 py-2 px-3 border-l-4 border-blue-600 bg-blue-50 rounded-r-md shadow-sm mb-2">
                                    {formatDateWithDay(dateString)}
                                    <span className="ml-2 text-gray-500 text-sm">({filteredCategories.length})</span>
                                </h3>
                                <div className="space-y-1.5">
                                    {filteredCategories.map((category) => {
                                        const countText = category.title.toLowerCase() === "pricing opportunity" 
                                            ? `(${category.items.length})` 
                                            : "";
                                            
                                        return (
                                            <div
                                                key={category.id}
                                                onClick={() => handleCategoryClick(category)}
                                                className={`p-2 rounded-md cursor-pointer transition-all duration-200 border-l-3 ${
                                                    selectedCategory?.id === category.id 
                                                        ? 'bg-blue-100 border-blue-500' 
                                                        : 'hover:bg-gray-100 border-transparent'
                                                } ${severityBorderColors[category.severity]}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${severityColors[category.severity]}`} />
                                                    <h4 className="text-sm font-medium truncate">{capitalizeTitle(category.title)} <span className="text-gray-500">{countText}</span></h4>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Right Column - Detailed Content */}
                <div className="lg:col-span-3 h-[calc(100vh-200px)]">
                    {selectedCategory ? (
                        renderDetailsPanel()
                    ) : (
                        <div className="flex justify-center items-center h-full text-gray-500 md:text-lg bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
                            Select an item from the list to view details
                        </div>
                    )}
                </div>
            </div>
            
            {/* Mobile layout */}
            <div className="lg:hidden">
                <div className="bg-white rounded-lg shadow-sm overflow-y-auto h-[calc(100vh-200px)]">
                    {groupedItemsArray.map(([dateString, items]) => {
                        // Group items by category
                        const categories = groupByCategory(items);
                        
                        // Filter categories if urgent only is selected
                        const filteredCategories = showUrgentOnly 
                            ? categories.filter(category => category.severity === "bad")
                            : categories;
                        
                        // Skip date group if it has no categories after filtering
                        if (filteredCategories.length === 0) return null;
                        
                        return (
                            <div key={dateString} className="mb-4 px-3 pt-2">
                                <h3 className="text-base font-bold text-gray-800 py-2 px-3 border-l-4 border-blue-600 bg-blue-50 rounded-r-md shadow-sm mb-2">
                                    {formatDateWithDay(dateString)}
                                    <span className="ml-2 text-gray-500 text-sm">({filteredCategories.length})</span>
                                </h3>
                                <div className="space-y-1.5">
                                    {filteredCategories.map((category) => {
                                        const countText = category.title.toLowerCase() === "pricing opportunity" 
                                            ? `(${category.items.length})` 
                                            : "";
                                            
                                        return (
                                            <div
                                                key={category.id}
                                                onClick={() => handleCategoryClick(category)}
                                                className={`p-2 rounded-md cursor-pointer transition-all duration-200 border-l-3 
                                                    hover:bg-gray-100 border-transparent
                                                    ${severityBorderColors[category.severity]}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${severityColors[category.severity]}`} />
                                                    <h4 className="text-sm font-medium truncate">{capitalizeTitle(category.title)} <span className="text-gray-500">{countText}</span></h4>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Mobile Modal */}
                {isMobileView && selectedCategory && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            {renderDetailsPanel()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}