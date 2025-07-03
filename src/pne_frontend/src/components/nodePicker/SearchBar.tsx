import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export function SearchBar({ searchTerm, onSearchChange, onRefresh }: SearchBarProps) {
  return (
    <div className='flex flex-row gap-2'>
      <div className="relative w-full">
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder="Search..."
        />
      </div>
      <Button
        size="icon"
        onClick={onRefresh}
      >
        <RefreshCw/>
      </Button>
    </div>
  );
} 