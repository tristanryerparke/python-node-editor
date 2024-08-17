import React, { useContext } from 'react';
import { Group, Text, ActionIcon, useMantineTheme } from '@mantine/core';
import { useNodesData } from '@xyflow/react';
import { IconInfoCircle, IconCode, IconLicense, IconRosetteDiscountCheck } from '@tabler/icons-react';
import { InspectorContext, NodeSelectionContext, PanelsContext } from '../../GlobalContext';

interface NodeTopBarProps {
  id: string;
}

const NodeTopBar: React.FC<NodeTopBarProps> = ({ id }) => {
  const theme = useMantineTheme();
  const nodeData = useNodesData(id);
  const { setIsLocked, setLockedNodeId } = useContext(InspectorContext);
  const { setSelectedNodeId } = useContext(NodeSelectionContext);
  const { panels, setPanels } = useContext(PanelsContext);

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
      case 'error':
        return theme.colors.red[5];
      default:
        return theme.colors.gray[5];
    }
  };

  const handleCodeClick = () => {
    if (nodeData.data.definition_path) {
      const cursorUrl = `cursor://file${encodeURI(nodeData.data.definition_path)}`;
      window.open(cursorUrl, '_blank');
    }
  };

  const handleInfoClick = () => {
    setIsLocked(true);
    setLockedNodeId(id);
    setSelectedNodeId(id);
    
    if (!panels.showInspector) {
      setPanels(prevPanels => ({
        ...prevPanels,
        showInspector: true
      }));
    }
  };

  return (
    <Group w='100%' justify='space-between' pl='0.5rem'>
      <Text fw={700} p='0rem' m='0rem'>{nodeData.data.name.replace('Node', '')}</Text>
      <Group m='0.25rem' p={0} gap='0.2rem' justify='flex-end'>
        {nodeData.data.streaming && (
          <IconLicense color='var(--mantine-color-indigo-5)' size={20} />
        )}
        <ActionIcon variant='subtle' size='sm' color='dark.2' radius='xl' onClick={handleCodeClick}>
          <IconCode />
        </ActionIcon>
        <ActionIcon variant='subtle' size='sm' color='dark.2' radius='xl' onClick={handleInfoClick}>
          <IconInfoCircle />
        </ActionIcon>
        <IconRosetteDiscountCheck 
          color={getStatusColor()}
          size={20} 
        />
      </Group>
    </Group>
  );
};

export default NodeTopBar;