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

    // Effect to select the first item in desktop view
    useEffect(() => {
        if (!loading && !isMobileView && newsItems.length > 0 && !selectedCategory) {
            // Get sorted items and categories
            const sortedItems = [...newsItems].sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            const groupedItems = groupByDate(sortedItems);
            const groupedItemsArray = Array.from(groupedItems.entries())
                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
            
            // Select first category from first date group if available
            if (groupedItemsArray.length > 0) {
                const [firstDateString, firstDateItems] = groupedItemsArray[0];
                const categories = groupByCategory(firstDateItems);
                const filteredCategories = showUrgentOnly 
                    ? categories.filter(category => category.severity === "bad")
                    : categories;
                
                if (filteredCategories.length > 0) {
                    setSelectedCategory(filteredCategories[0]);
                }
            }
        }
    }, [loading, isMobileView, newsItems, showUrgentOnly]);

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
    
    // Render a single details panel for either desktop or mobile
    const renderCategoryDetails = (category: GroupedCategory) => {
        if (category.title.toLowerCase() === "pricing opportunity") {
            return (
                <div className="space-y-4 md:space-y-5">
                    {/* Sort items by severity with bad/critical first */}
                    {[...category.items]
                        .sort((a, b) => getSeverityValue(a.severity) - getSeverityValue(b.severity))
                        .map((item) => {
                            // Extract item name from first part of description
                            const descriptionParts = item.description.split(',');
                            const itemName = descriptionParts[0].replace('Item:', '').trim();
                            
                            // Skip the first part that's used as the header
                            const restOfDescription = descriptionParts.slice(1).join(',');
                            
                            return (
                                <div 
                                    key={item.id} 
                                    className={`border rounded-lg p-3 md:p-4 hover:shadow-sm transition-all ${
                                        mapSeverity(item.severity) === "bad" ? "border-l-4 border-l-red-500" : ""
                                    }`}
                                >
                                    <h3 className="font-medium mb-2 md:text-lg">{itemName}</h3>
                                    <div className="text-sm md:text-base text-gray-700 whitespace-pre-line">{restOfDescription}</div>
                                    <div className="mt-2 md:mt-3 flex justify-end">
                                        <button 
                                            onClick={() => handleChatAction(item.description)}
                                            className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                            Ask Luna
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            );
        } else if (category.items.length === 1) {
            // Single item view
            return (
                <div>
                    {category.items[0].imageUrl && (
                        <div className="relative h-48 md:h-64 w-full mb-4 md:mb-6 rounded-md overflow-hidden">
                            <Image
                                src={category.items[0].imageUrl}
                                alt={category.items[0].title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    
                    <div className="mb-4 md:mb-6">
                        <p className="text-gray-700 md:text-lg whitespace-pre-line">
                            {category.items[0].description}
                        </p>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm md:text-base text-gray-500 mt-6">
                        <span>{formatDateWithDay(category.items[0].date)}</span>
                        <button 
                            onClick={() => handleChatAction(category.items[0].description)}
                            className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Ask Luna
                        </button>
                    </div>
                </div>
            );
        } else {
            // Multiple items view for non-pricing opportunity categories
            return (
                <div className="space-y-3 md:space-y-4">
                    {/* Sort items by severity with bad/critical first */}
                    {[...category.items]
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
            );
        }
    };
    
    // MOBILE VIEW
    if (isMobileView) {
        return (
            <div className="px-4">
                {/* Filter buttons */}
                <div className="flex justify-end mb-2">
                    <div className="inline-flex items-center rounded-md shadow-sm border overflow-hidden">
                        <button
                            onClick={() => setShowUrgentOnly(false)}
                            className={`px-3 py-1.5 text-sm font-medium ${!showUrgentOnly ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            All Alerts
                        </button>
                        <button
                            onClick={() => setShowUrgentOnly(true)}
                            className={`px-3 py-1.5 text-sm font-medium ${showUrgentOnly ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            Urgent Only
                        </button>
                    </div>
                </div>
                
                {/* Mobile List View */}
                <div className="bg-white rounded-lg shadow-sm overflow-y-auto h-[calc(100vh-120px)]">
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
                            <div key={dateString} className="mb-3 px-3 pt-2">
                                <h3 className="text-sm font-bold text-gray-800 py-1.5 px-3 border-l-4 border-blue-600 bg-blue-50 rounded-r-md shadow-sm mb-2">
                                    {formatDateWithDay(dateString)}
                                    <span className="ml-2 text-gray-500 text-xs">({filteredCategories.length})</span>
                                </h3>
                                <div className="space-y-1">
                                    {filteredCategories.map((category) => {
                                        // Always show the count for all categories
                                        const countText = `(${category.items.length})`;
                                        
                                        return (
                                            <div
                                                key={category.id}
                                                onClick={() => handleCategoryClick(category)}
                                                className={`p-1.5 rounded-md cursor-pointer transition-all duration-200 border-l-3 
                                                    hover:bg-gray-100 border-transparent
                                                    ${severityBorderColors[category.severity]}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${severityColors[category.severity]}`} />
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
                {selectedCategory && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">
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
                                        <button 
                                            onClick={closeModal}
                                            className="ml-2 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                {renderCategoryDetails(selectedCategory)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    // DESKTOP VIEW
    return (
        <div className="w-full flex flex-col p-0">
            <div className="flex justify-end mb-6">
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
            
            <div className="flex h-[calc(100vh-180px)]">
                {/* Left sidebar with proper padding */}
                <div className="w-80 xl:w-[380px] 2xl:w-[440px] flex-shrink-0 overflow-y-auto pb-6 pr-8">
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
                            <div key={dateString} className="mb-5">
                                <h3 className="text-base font-bold text-gray-800 py-2 px-4 border-l-4 border-blue-600 bg-blue-50 rounded-r-md shadow-sm mb-4">
                                    {formatDateWithDay(dateString)}
                                    <span className="ml-2 text-gray-500 text-sm">({filteredCategories.length})</span>
                                </h3>
                                <div className="space-y-3">
                                    {filteredCategories.map((category) => {
                                        // Always show the count for all categories
                                        const countText = `(${category.items.length})`;
                                        const isLargeCategory = category.items.length > 5;
                                        const isPricingOpportunity = category.title.toLowerCase() === "pricing opportunity";
                                        
                                        return (
                                            <div
                                                key={category.id}
                                                onClick={() => handleCategoryClick(category)}
                                                className={`p-3.5 rounded-md cursor-pointer transition-all duration-200 border-l-3 ${
                                                    selectedCategory?.id === category.id 
                                                        ? 'bg-blue-100 border-blue-500' 
                                                        : 'hover:bg-gray-100 border-transparent'
                                                } ${severityBorderColors[category.severity]} ${(isPricingOpportunity || isLargeCategory) ? 'mb-1' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${severityColors[category.severity]} flex-shrink-0`} />
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm font-medium break-normal">
                                                            {capitalizeTitle(category.title)} 
                                                            <span className="ml-1 text-gray-500">{countText}</span>
                                                        </h4>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Main content area with proper padding */}
                <div className="flex-grow min-w-[500px] xl:min-w-[600px] 2xl:min-w-[700px] bg-white rounded-lg shadow-sm p-8 border border-gray-200 overflow-y-auto ml-8 mr-0">
                    {selectedCategory ? (
                        <div>
                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {capitalizeTitle(selectedCategory.title)}
                                    {selectedCategory.items.length > 1 && 
                                        <span className="ml-2 text-gray-500 text-base">
                                            ({selectedCategory.items.length} items)
                                        </span>
                                    }
                                </h2>
                                <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${severityTextColors[selectedCategory.severity]} bg-gray-100`}>
                                    {selectedCategory.severity === "bad" ? "Red" : 
                                     selectedCategory.severity === "good" ? "Green" : "Neutral"}
                                </div>
                            </div>
                            
                            {renderCategoryDetails(selectedCategory)}
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-gray-500 text-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-gray-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                            <p>Select an item from the list to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}