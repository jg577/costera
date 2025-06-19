import Link from "next/link";

export function Nav() {
    return (
        <nav className="flex items-center justify-between p-4 bg-white shadow-md">
            <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
                    <span className="text-xl font-bold text-gray-800">Costera</span>
                </Link>
                <div className="hidden md:flex items-center space-x-4">
                    <Link
                        href="/"
                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm md:text-lg font-medium"
                    >
                        Chat
                    </Link>
                    <Link
                        href="/newsfeed"
                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm md:text-lg font-medium"
                    >
                        Feed
                    </Link>
                </div>
            </div>
        </nav>
    );
} 