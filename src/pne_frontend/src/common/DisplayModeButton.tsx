import { ActionIcon } from '@mantine/core';
import { IconDeviceDesktop, IconHandFinger, IconFileCode } from '@tabler/icons-react';

interface DisplayModeButtonProps {
  displayMode: 'Debug' | 'Pretty';
  setDisplayMode: (mode: 'Debug' | 'Pretty') => void;
}

export function DisplayModeButton({ 
  displayMode,
  setDisplayMode,
}: DisplayModeButtonProps) {


  return (
    <ActionIcon 
      size="sm"
      variant="subtle"
      onClick={() => setDisplayMode(displayMode === 'Debug' ? 'Pretty' : 'Debug')}
    >
      {displayMode === 'Debug' 
        ? <IconFileCode size={16} /> 
        : <IconHandFinger size={16} />
      }
    </ActionIcon>
  );
}
