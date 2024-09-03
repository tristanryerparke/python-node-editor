import React, { useContext } from 'react';
import { Flex,Group, Text, ActionIcon, useMantineTheme, Tooltip, Progress } from '@mantine/core';
import { useNodesData } from '@xyflow/react';
import { IconInfoCircle, IconCode, IconLicense, IconRosetteDiscountCheck, IconX } from '@tabler/icons-react';
import { InspectorContext, NodeSelectionContext, PanelsContext } from '../../GlobalContext';
import { getStatusColor } from '../../utils/Colors';
import type { BaseNodeData } from '../../types/DataTypes';


interface NodeTopBarProps {
  id: string;
}

const NodeTopBar: React.FC<NodeTopBarProps> = ({ id }) => {
  const theme = useMantineTheme();
  const node = useNodesData(id)!;
  const nodeData = node.data as unknown as BaseNodeData;
  const { isLocked, lockedNodeId, setIsLocked, setLockedNodeId } = useContext(InspectorContext);
  const { setSelectedNodeId } = useContext(NodeSelectionContext);
  const { panels, setPanels } = useContext(PanelsContext);

  const statusColor = getStatusColor(nodeData.status, theme);

  const handleCodeClick = () => {
    if (nodeData.definition_path) {
      const cursorUrl = `cursor://file${encodeURI(nodeData.definition_path)}`;
      window.open(cursorUrl, '_blank');
    }
  };

  const handleInfoClick = () => {
    if (isLocked && lockedNodeId === id) {
      setIsLocked(false);
      setLockedNodeId(null);
    } else {
      setIsLocked(true);
      setLockedNodeId(id);
      setSelectedNodeId(id);
      
      if (!panels.showInspector) {
        setPanels(prevPanels => ({
          ...prevPanels,
          showInspector: true
        }));
      }
    }
  };

  const isNodeLocked = isLocked && lockedNodeId === id;

  return (
    <Flex direction='column' p={0} m={0} gap='0rem' w='100%' align='center' justify='center'>
      <Group w='100%' justify='space-between' pl='0.5rem' mb={0}>
        <Tooltip
          label={nodeData.description || 'No Description'}
          color='dark.3'
          withArrow
          arrowSize={8}
          multiline
          w='200px'
        >
          <Text fw={700} p='0rem' m='0rem' >
            {nodeData.display_name}
          </Text>
        </Tooltip>
        <Group m='0.25rem' p={0} gap='0.2rem' justify='flex-end'>
          {(nodeData.streaming) && (
            <Tooltip label="Streaming Node" color='dark.3' withArrow arrowSize={8}>
              <IconLicense color='var(--mantine-color-indigo-5)' size={20} />
            </Tooltip>
          )}
          <Tooltip label="View Source Code" color='dark.3' withArrow arrowSize={8}>
            <ActionIcon variant='subtle' size='sm' color='dark.2' radius='xl' onClick={handleCodeClick}>
              <IconCode />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={isNodeLocked ? "Unlock Inspector" : "Lock Inspector to Node"} color='dark.3' withArrow arrowSize={8}>
            <ActionIcon 
              variant='subtle' 
              size='sm' 
              color={isNodeLocked ? 'red.5' : 'dark.2'} 
              radius='xl' 
              onClick={handleInfoClick}
            >
              <IconInfoCircle />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={`Status: ${nodeData.status}`} color='dark.3' withArrow>
            <ActionIcon variant='subtle' size='sm' color={statusColor} radius='xl' loading={nodeData.status === 'executing' || nodeData.status === 'streaming'}>
              {nodeData.status === 'error' ? (
                <IconX color={statusColor} size={20} />
              ) : (
                <IconRosetteDiscountCheck 
                  color={statusColor}
                  size={20} 
                />
              )}
            </ActionIcon>
          </Tooltip>
        </Group>
        
      </Group>
      <Group w='100%' justify='center' px='0.5rem'>
        {nodeData.streaming && nodeData.progress !== undefined && (
            <Progress value={nodeData.progress * 100} size='xs' w='100%' color="indigo.5" mt={0}mb='0.25rem'/>
          )}
      </Group>
    </Flex>
  );
};

export default NodeTopBar;