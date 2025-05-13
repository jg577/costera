import { Database } from "lucide-react";

export const Header = ({ handleClear }: { handleClear: () => void }) => {
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
    </div>
  );
};
