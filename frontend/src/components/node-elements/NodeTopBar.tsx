import React from 'react';
import { Group, Text, ActionIcon } from '@mantine/core';
import { IconInfoCircle, IconCode, IconCheck, IconLicense } from '@tabler/icons-react';

interface NodeTopBarProps {
  name: string;
  streaming: boolean;
}

const NodeTopBar: React.FC<NodeTopBarProps> = ({ name, streaming }) => {
  return (
    <Group w='100%' justify='space-between' pl='0.5rem'>
      <Text fw={700} p='0rem' m='0rem'>{name.replace('Node', '')}</Text>
      <Group m='0.25rem' p={0} gap='0.1rem' justify='flex-end'>
        {streaming && (
          <IconLicense color='var(--mantine-color-indigo-5)' size={20} />
        )}
        <ActionIcon variant='subtle' size='sm' color='green.4' radius='xl'>
          <IconCode />
        </ActionIcon>

        <ActionIcon variant='subtle' size='sm' color='orange' radius='xl'>
          <IconInfoCircle />
        </ActionIcon>

        {/* <IconCheck color='orange' size={20} stroke={4}/> */}
      </Group>
    </Group>
  );
};

export default NodeTopBar;