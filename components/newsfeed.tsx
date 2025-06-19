"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

type Severity = "good" | "neutral" | "bad";

interface NewsItem {
    id: string;
    title: string;
    description: string;
    severity: Severity | number;
    date: string;      // New field from backend
    timestamp: string;
    imageUrl?: string;
    additional_detail?: string;  // Additional detail from backend
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
    good: "border-green-200",
    neutral: "border-amber-200",
    bad: "border-red-200"
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
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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

// Helper function to format currency
const formatCurrency = (amount: string | number): string => {
    // Convert to number if it's a string
    const numericValue = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
    
    // Format as USD with 2 decimal places
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericValue);
};

// Function to parse pricing alert description
const parsePricingAlertDescription = (description: string) => {
    const parts = description.split('|').map(part => part.trim());

    const itemName = parts[0].replace('Item: ', '');
    const manufacturer = parts[1].replace('Manufacturer: ', '');
    const packSize = parts[2].replace('Pack: ', '');
    const spend = parseFloat(parts[3].replace('Spend: $', ''));
    const orderSavingsPotential = parseFloat(parts[4].replace('Order Savings Potential: $', ''));
    const unitPrice = parseFloat(parts[5].replace('Unit Price (lbs) $', ''));
    const cheaperPriceDate = parts[6].replace('Cheaper Unit Price (lbs) on ', '');
    const cheaperUnitPrice = parseFloat(parts[7].replace('$', ''));
    const lowManufacturer = parts[8].replace('Low Manufacturer: ', '');
    const lowPackSize = parts[9].replace('Pack: ', '');

    return {
        itemName,
        manufacturer,
        packSize,
        spend,
        orderSavingsPotential,
        unitPrice,
        cheaperPriceDate,
        cheaperUnitPrice,
        lowManufacturer,
        lowPackSize
    };
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
            setLoading(true);
            try {
                const response = await fetch('https://luna-backend-gamma.vercel.app/api/news?limit=1000');
                const data = await response.json();
                const sortedData = data.sort((a: NewsItem, b: NewsItem) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setNewsItems(sortedData);
            } catch (error) {
                console.error('Error fetching news:', error);
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

    const handleChatAction = (description: string, additional_detail?: string) => {
        // Combine description with additional_detail if available
        const fullContent = additional_detail 
            ? `${description}\n\nAdditional Context: ${additional_detail}`
            : description;
        
        // Set the input value in the URL state for chat
        router.push(`/?input=${encodeURIComponent(fullContent)}`);
    };
    
    const closeModal = () => {
        if (isMobileView) {
            setSelectedCategory(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            const itemsWithParsedDetails = category.items.map(item => {
                const parsedDetails = parsePricingAlertDescription(item.description);
                return {
                    ...item,
                    ...parsedDetails
                };
            });
            
            // Calculate total potential savings
            const totalPotentialSavings = itemsWithParsedDetails.reduce((total, item) => total + (item.orderSavingsPotential || 0), 0);
            
            // Sort items by order savings potential in descending order
            itemsWithParsedDetails.sort((a, b) => b.orderSavingsPotential - a.orderSavingsPotential);
            
            // Render logic using parsed details
            return (
                <div className="space-y-4">
                    {itemsWithParsedDetails.map((item) => {
                        // Format the order savings potential as currency
                        const formattedSavings = item.orderSavingsPotential ? formatCurrency(item.orderSavingsPotential) : null;

                        // Create a human-readable alert message
                        const alertMessage = `
                            Item: ${item.itemName} from ${item.manufacturer}.
                            Current Spend: ${formatCurrency(item.spend)}.
                            Potential Savings: ${formattedSavings}.
                            Current Unit Price: ${formatCurrency(item.unitPrice)}.
                            Cheaper Unit Price: ${formatCurrency(item.cheaperUnitPrice)} available on ${item.cheaperPriceDate}.
                            Low Manufacturer: ${item.lowManufacturer}.
                            Low Pack Size: ${item.lowPackSize}.
                        `;

                        return (
                            <div 
                                key={item.id} 
                                className={`p-4 rounded-lg border-l-4 ${severityBorderColors[mapSeverity(item.severity)]} bg-white hover:shadow-md transition-shadow`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-800 mb-1">{item.itemName}</h3>
                                    {formattedSavings && (
                                        <div className="text-green-600 font-medium whitespace-nowrap">
                                            Potential Savings: {formattedSavings}
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 whitespace-pre-line">{alertMessage}</div>
                                <div className="mt-2 flex justify-end">
                                    <button 
                                        onClick={() => handleChatAction(item.description, item.additional_detail)}
                                        className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                                    >
                                        Ask Costera
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        } else if (category.items.length === 1) {
            // Single item view
            return (
                <div>
                    {category.items[0].imageUrl && (
                        <div className="relative h-40 w-full mb-3 rounded-md overflow-hidden">
                            <Image
                                src={category.items[0].imageUrl}
                                alt={category.items[0].title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    
                    <div className="mb-4">
                        <p className="text-gray-600 text-sm mb-3">
                            {category.items[0].description}
                        </p>
                    </div>
                    
                    <div className="flex justify-end">
                        <button 
                            onClick={() => handleChatAction(category.items[0].description, category.items[0].additional_detail)}
                            className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                        >
                            Ask Costera
                        </button>
                    </div>
                </div>
            );
        } else {
            // Multiple items view for non-pricing opportunity categories
            return (
                <div className="space-y-3">
                    {/* Sort items by severity with bad/critical first */}
                    {[...category.items]
                        .sort((a, b) => getSeverityValue(a.severity) - getSeverityValue(b.severity))
                        .map((item) => (
                        <div 
                            key={item.id} 
                            className={`p-4 rounded-lg border-l-4 ${severityBorderColors[mapSeverity(item.severity)]} bg-white hover:shadow-md transition-shadow`}
                        >
                            <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                            <div className="mt-2 flex justify-end">
                                <button 
                                    onClick={() => handleChatAction(item.description, item.additional_detail)}
                                    className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                                >
                                    Ask Costera
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
            <div className="px-0">
                <div className="flex justify-end my-4 px-4">
                    <div className="inline-flex items-center rounded-xl shadow-sm border border-gray-200 overflow-hidden bg-white">
                        <button
                            onClick={() => setShowUrgentOnly(false)}
                            className={`px-6 py-3 text-sm font-medium transition-all duration-200 ${
                                !showUrgentOnly 
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            All Alerts
                        </button>
                        <button
                            onClick={() => setShowUrgentOnly(true)}
                            className={`px-6 py-3 text-sm font-medium transition-all duration-200 ${
                                showUrgentOnly 
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md' 
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
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
                                <div className="space-y-1 px-1">
                                    {filteredCategories.map((category) => {
                                        // Always show the count for all categories
                                        const countText = `(${category.items.length})`;
                                        
                                        return (
                                            <div
                                                key={category.id}
                                                onClick={() => handleCategoryClick(category)}
                                                className={`p-6 rounded-xl cursor-pointer transition-all duration-200 border ${
                                                    selectedCategory?.id === category.id 
                                                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-md' 
                                                        : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                } ${severityBorderColors[category.severity]}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-4 h-4 rounded-full ${severityColors[category.severity]} shadow-sm`} />
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-base font-semibold text-gray-900 mb-1">
                                                            {capitalizeTitle(category.title)}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">{countText}</p>
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
                
                {/* Mobile Modal */}
                {selectedCategory && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center flex-wrap">
                                            {capitalizeTitle(selectedCategory.title)}
                                            {selectedCategory.items.length > 1 && 
                                                <span className="ml-2 text-gray-500 text-base">
                                                    ({selectedCategory.items.length} items)
                                                </span>
                                            }
                                            {selectedCategory.title.toLowerCase() === "pricing opportunity" && (
                                                <span className="ml-3 text-green-600 font-medium text-lg">
                                                    · Total Potential Savings: {formatCurrency(selectedCategory.items.reduce((total, item) => {
                                                        const parsedDetails = parsePricingAlertDescription(item.description);
                                                        return total + (parsedDetails.orderSavingsPotential || 0);
                                                    }, 0))}
                                                </span>
                                            )}
                                        </h2>
                                    </div>
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
        <div className="flex h-[calc(100vh-65px)]">
            {/* Left sidebar */}
            <div className="w-1/3 xl:w-1/4 h-full overflow-y-auto p-6 border-r border-gray-200">
                <div className="space-y-6">
                    {groupedItemsArray.map(([dateString, items]) => {
                        const categories = groupByCategory(items);
                        if (categories.length === 0) return null;
                        return (
                            <div key={dateString}>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 px-1">
                                    {formatDateWithDay(dateString)}
                                </h3>
                                <div className="space-y-2">
                                    {categories.map((category) => (
                                        <div
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedCategory?.id === category.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${severityColors[category.severity]} flex-shrink-0`} />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-sm text-gray-800">{capitalizeTitle(category.title)}</h4>
                                                    <p className="text-xs text-gray-500">{category.items.length} item(s)</p>
                                                </div>
                                                <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${selectedCategory?.id === category.id ? 'translate-x-1' : ''}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Main content area */}
            <div className="flex-grow w-2/3 xl:w-3/4 h-full overflow-y-auto p-6">
                {selectedCategory ? (
                    <div>
                        <div className="pb-4 mb-4 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {capitalizeTitle(selectedCategory.title)}
                            </h2>
                            <p className="text-sm text-gray-500">{selectedCategory.items.length} related item(s)</p>
                        </div>
                        {renderCategoryDetails(selectedCategory)}
                    </div>
                ) : (
                    <div className="flex flex-col justify-center items-center h-full text-gray-500 text-lg">
                        <p>Select an item from the list to view details.</p>
                    </div>
                )}
            </div>
        </div>
    );
}