import { ActionIcon } from '@mantine/core';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';

export type Direction = 'up' | 'down';

interface ChevronButtonProps {
  initialDirection?: Direction;
  direction?: Direction;  // For controlled state
  onChange?: (direction: Direction) => void;
}

export function ChevronButton({ 
  initialDirection = 'up',
  direction: controlledDirection,
  onChange,
}: ChevronButtonProps) {
  const [internalDirection, setInternalDirection] = useState<Direction>(initialDirection);
  
  // Use controlled direction if provided, otherwise use internal state
  const direction = controlledDirection ?? internalDirection;
  
  const handleClick = () => {
    const nextDirection: Direction = direction === 'up' ? 'down' : 'up';
    
    // Update internal state if uncontrolled
    if (controlledDirection === undefined) {
      setInternalDirection(nextDirection);
    }
    // Notify parent of change
    onChange?.(nextDirection);
  };
  
  const icons = {
    up: <IconChevronUp />,
    down: <IconChevronDown />
  };

  return (
    <ActionIcon 
      size="sm"
      variant="subtle"
      onClick={handleClick}
    >
      {icons[direction]}
    </ActionIcon>
  );
}
