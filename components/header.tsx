"use client";
import Link from "next/link";

export function Header() {
    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <span className="text-white font-bold text-xl">C</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Costera
                        </h1>
                    </Link>
                    <nav className="flex items-center space-x-2">
                        <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Chat
                        </Link>
                        <Link href="/newsfeed" className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Feed
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
