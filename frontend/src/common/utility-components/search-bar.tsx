import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void | Promise<unknown>;
  placeholder?: string;
  refreshTitle?: string;
  ariaLabel?: string;
}

export function SearchBar({
  searchTerm,
  onSearchChange,
  onRefresh,
  placeholder = "Search...",
  refreshTitle = "Refresh",
  ariaLabel = "Search",
}: SearchBarProps) {
  return (
    <div className="flex flex-row gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder={placeholder}
          className="pl-8 w-full min-h-9"
          aria-label={ariaLabel}
        />
      </div>
      <Button
        size="icon"
        variant="outline"
        onClick={() => {
          void onRefresh();
        }}
        title={refreshTitle}
        aria-label={refreshTitle}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
