import { Search as SearchIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await handleSubmit();
      }}
      className={submitted ? "w-full" : "mb-6"}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-grow">
          <div className="container-box flex items-center">
            <Input
              type="text"
              placeholder={submitted ? "Ask another question about your data..." : "Ask about your business operations or performance..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="friendly-input border-0 shadow-none bg-transparent px-0 focus:ring-0 h-9"
            />
          </div>
          <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
        <div className="flex sm:flex-row items-center justify-center gap-2">
          {submitted ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="friendly-button w-full sm:w-auto"
              >
                Clear All
              </Button>
              <Button
                type="submit"
                className="friendly-button primary-button w-full sm:w-auto"
              >
                Search
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              className="friendly-button primary-button w-full sm:w-auto"
            >
              Search
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
