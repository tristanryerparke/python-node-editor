import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ChevronButtonProps {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

export function ChevronButton({ 
  expanded,
  setExpanded,
}: ChevronButtonProps) {
  const handleClick = () => {
    setExpanded(!expanded);
  };
  
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleClick}
      className="border-none w-6 h-6 p-0"
    >
      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </Button>
  );
}
