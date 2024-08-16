import React from 'react';
import { Group, Text, ActionIcon, useMantineTheme } from '@mantine/core';
import { useNodesData } from '@xyflow/react';
import { IconInfoCircle, IconCode, IconLicense, IconRosetteDiscountCheck } from '@tabler/icons-react';


interface NodeTopBarProps {
  id: string;
}

const NodeTopBar: React.FC<NodeTopBarProps> = ({ id }) => {
  const theme = useMantineTheme();

  const nodeData = useNodesData(id);

  const getStatusColor = () => {
    switch (nodeData.data.status) {
      case 'pending':
        return theme.colors.orange[5];
      case 'executing':
        return theme.colors.blue[5];
      case 'streaming':
        return theme.colors.indigo[5];
      case 'evaluated':
        return theme.colors.green[5];
      default:
        return theme.colors.gray[5];
    }
  };

  return (
    <Group w='100%' justify='space-between' pl='0.5rem'>
      <Text fw={700} p='0rem' m='0rem'>{nodeData.data.name.replace('Node', '')}</Text>
      <Group m='0.25rem' p={0} gap='0.2rem' justify='flex-end'>

        {/* Streaming icon */}
        {nodeData.data.streaming && (
          <IconLicense color='var(--mantine-color-indigo-5)' size={20} />
        )}

        {/* Code/Terminal icon */}
        <ActionIcon variant='subtle' size='sm' color='dark.2'radius='xl'>
          <IconCode />
        </ActionIcon>
        
        <ActionIcon variant='subtle' size='sm' color='dark.2' radius='xl'>
          <IconInfoCircle />
        </ActionIcon>

        <IconRosetteDiscountCheck 
          color={getStatusColor()}
          size={20} 
        />



        {/* <IconCheck color='orange' size={20} stroke={4}/> */}
      </Group>
    </Group>
  );
};

export default NodeTopBar;