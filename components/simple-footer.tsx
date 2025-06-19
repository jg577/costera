export function SimpleFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Costera, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
} 