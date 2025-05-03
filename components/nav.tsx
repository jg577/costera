import Link from "next/link";

export function Nav() {
    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex w-full">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                Luna
                            </Link>
                        </div>
                        <div className="ml-4 flex flex-1 justify-end space-x-4 sm:ml-6 sm:space-x-8">
                            <Link
                                href="/"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Chat
                            </Link>
                            <Link
                                href="/newsfeed"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Feed
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
} 