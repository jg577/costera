import { Search as SearchIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SearchProps {
  handleClear: () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  inputValue: string;
  setInputValue: (value: string) => void;
  submitted: boolean;
}

export function Search({
  handleClear,
  handleSubmit,
  inputValue,
  setInputValue,
  submitted
}: SearchProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Set height to scrollHeight + a little extra for padding
      const newHeight = Math.max(textarea.scrollHeight, 40);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await handleSubmit();
      }}
      className={submitted ? "w-full" : "mb-6"}
    >
      <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-grow w-full">
          <div className="search-input-container !border !border-blue-300 !rounded-md !bg-blue-50 relative">
            <textarea
              ref={textareaRef}
              placeholder={submitted ? "Ask another question about your data..." : "Ask about your business operations or performance..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="friendly-input w-full !border-0 !shadow-none !bg-transparent px-3 py-2 !focus:ring-blue-300 text-sm md:text-lg resize-none"
              rows={1}
              style={{ paddingRight: '2.5rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="absolute right-3 top-3 text-blue-500">
              <SearchIcon className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
        </div>
        
        <div className="flex sm:flex-row items-center self-start justify-center gap-2 flex-shrink-0">
          {submitted ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="friendly-button w-full sm:w-auto text-sm md:text-lg h-10 md:h-12 !border-blue-300 !text-blue-700 !bg-blue-50 hover:!bg-blue-100"
              >
                Clear All
              </Button>
              <Button
                type="submit"
                className="friendly-button w-full sm:w-auto text-sm md:text-lg h-10 md:h-12 !bg-blue-500 hover:!bg-blue-600 !text-white"
              >
                Search
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              className="friendly-button w-full sm:w-auto text-sm md:text-lg h-10 md:h-12 !bg-blue-500 hover:!bg-blue-600 !text-white"
            >
              Search
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
