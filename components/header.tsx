"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isLandingPage = pathname === "/";

    // Don't render a header on the login page for a cleaner UI
    if (pathname === '/login') {
        return null;
    }

    const renderNavLinks = () => {
        if (!isMounted) {
            // On the server, and on the initial client render, show a placeholder.
            // This guarantees that the client and server render the same thing,
            // preventing a hydration error.
            return <div className="w-24 h-8 bg-gray-200 rounded-md animate-pulse" />;
        }

        if (session) {
            // --- USER IS LOGGED IN ---
            return isLandingPage ? (
                // On landing page, show Dashboard and Sign Out
                <>
                    <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Dashboard
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Sign Out
                    </button>
                </>
            ) : (
                // On app pages (dashboard, etc.), show app nav
                <>
                    <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Chat
                    </Link>
                    <Link href="/newsfeed" className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Feed
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Sign Out
                    </button>
                </>
            );
        } else {
            // --- USER IS NOT LOGGED IN ---
            return (
                <Link href="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Sign In
                </Link>
            );
        }
    };

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <span className="text-white font-bold text-xl">C</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Costera
                        </h1>
                    </Link>
                    <nav className="flex items-center space-x-4">
                        {renderNavLinks()}
                    </nav>
                </div>
            </div>
        </header>
    );
}
