import { Input } from "t-components/input";
import { Button } from "t-components/button";
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
    <div className="flex h-6 w-full flex-row items-center gap-2">
      <div className="relative flex h-6 flex-1 items-center">
        <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
          <Search className="size-3 text-muted-foreground" />
        </span>
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder={placeholder}
          className="!h-6 !pl-7 w-full"
          aria-label={ariaLabel}
        />
      </div>
      <Button
        size="icon-xs"
        variant="outline"
        onClick={() => {
          void onRefresh();
        }}
        title={refreshTitle}
        aria-label={refreshTitle}
        className="!size-6"
      >
        <RefreshCw className="size-3" />
      </Button>
    </div>
  );
}
