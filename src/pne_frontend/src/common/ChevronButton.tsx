import { ActionIcon } from '@mantine/core';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';

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
    <ActionIcon 
      size="sm"
      variant="subtle"
      onClick={handleClick}
      classNames={{
        root: 'border-none',
      }}
    >
      {expanded ? <IconChevronUp /> : <IconChevronDown />}
    </ActionIcon>
  );
}
