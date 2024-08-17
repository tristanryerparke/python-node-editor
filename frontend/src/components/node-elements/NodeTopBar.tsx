import React, { useContext } from 'react';
import { Group, Text, ActionIcon, useMantineTheme, Tooltip } from '@mantine/core';
import { useNodesData } from '@xyflow/react';
import { IconInfoCircle, IconCode, IconLicense, IconRosetteDiscountCheck } from '@tabler/icons-react';
import { InspectorContext, NodeSelectionContext, PanelsContext } from '../../GlobalContext';
import { getStatusColor } from '../../utils/Colors';

interface NodeTopBarProps {
  id: string;
}

const NodeTopBar: React.FC<NodeTopBarProps> = ({ id }) => {
  const theme = useMantineTheme();
  const nodeData = useNodesData(id);
  const { setIsLocked, setLockedNodeId } = useContext(InspectorContext);
  const { setSelectedNodeId } = useContext(NodeSelectionContext);
  const { panels, setPanels } = useContext(PanelsContext);

  const statusColor = getStatusColor(nodeData.data.status, theme);

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
      <Tooltip
        label={nodeData.data.description || 'No Description'}
        color='dark.3'
        withArrow
        arrowSize={8}
        multiline
        width={200}
      >
        <Text fw={700} p='0rem' m='0rem' style={{ cursor: 'help' }}>
          {nodeData.data.name.replace('Node', '')}
        </Text>
      </Tooltip>
      <Group m='0.25rem' p={0} gap='0.2rem' justify='flex-end'>
        {nodeData.data.streaming && (
          <Tooltip label="Streaming Node" color='dark.3' withArrow arrowSize={8}>
            <IconLicense color='var(--mantine-color-indigo-5)' size={20} />
          </Tooltip>
        )}
        <Tooltip label="View Source Code" color='dark.3' withArrow arrowSize={8}>
          <ActionIcon variant='subtle' size='sm' color='dark.2' radius='xl' onClick={handleCodeClick}>
            <IconCode />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Lock Inspector to Node" color='dark.3' withArrow arrowSize={8}>
          <ActionIcon variant='subtle' size='sm' color='dark.2' radius='xl' onClick={handleInfoClick}>
            <IconInfoCircle />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={`Status: ${nodeData.data.status}`} color='dark.3' withArrow>
          <IconRosetteDiscountCheck 
            color={statusColor}
            size={20} 
            style={{ transition: 'color 0.25s ease-in-out' }}
          />
        </Tooltip>
      </Group>
    </Group>
  );
};

export default NodeTopBar;