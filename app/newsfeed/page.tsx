import { Newsfeed } from "@/components/newsfeed";

export default function NewsfeedPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">Newsfeed</h1>
                <Newsfeed />
            </div>
        </main>
    );
} 