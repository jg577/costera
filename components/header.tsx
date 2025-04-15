import { Moon, Sun, Database } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";

export const Header = ({ handleClear }: { handleClear: () => void }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex flex-col">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
          <Database className="h-5 w-5 mr-2 text-primary" />
          <a
            href="https://12bones.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-200 hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            12 Bones Smokehouse and Brewing
          </a>
        </h1>
        <div
          className="text-xs text-muted-foreground ml-7 cursor-pointer"
          onClick={() => handleClear()}
        >
          Powered by Luna
        </div>
      </div>
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-md h-8 w-8 border border-border bg-secondary/50 hover:bg-secondary/80"
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4 text-foreground" />
          ) : (
            <Sun className="h-4 w-4 text-foreground" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  );
};
