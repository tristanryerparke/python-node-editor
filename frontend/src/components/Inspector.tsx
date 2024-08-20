import { Panel, PanelResizeHandle } from 'react-resizable-panels';
import { 
  Flex, 
  Text, 
  Title, 
  Box, 
  Badge, 
  useMantineTheme, 
  ScrollArea, 
  Divider, 
  ActionIcon,
} from '@mantine/core'  
import { IconLockOpen, IconLockFilled } from '@tabler/icons-react';
import { useContext } from 'react';
import { NodeSelectionContext, InspectorContext } from '../GlobalContext';
import { useNodes } from '@xyflow/react';
import { getStatusColor } from '../utils/Colors';
import type { BaseNodeData } from '../types/DataTypes';

function InspectorPanel() {
  const { selectedNodeId } = useContext(NodeSelectionContext);
  const { isLocked, setIsLocked, lockedNodeId, setLockedNodeId } = useContext(InspectorContext);
  const theme = useMantineTheme();

  const toggleLock = () => {
    setIsLocked(!isLocked);
    if (!isLocked) {
      setLockedNodeId(selectedNodeId);
    } else {
      setLockedNodeId(null);
    }
  };

  const nodes = useNodes();

  const nodeToDisplay = isLocked ? lockedNodeId : selectedNodeId;
  const selectedNode = nodes.find(node => node.id === nodeToDisplay);
  const selectedNodeData = selectedNode?.data as unknown as BaseNodeData;


  const renderInputs = (inputs: Record<string, { value: unknown, type: string }>) => (
    <Box>
      <Title order={4}>Inputs:</Title>
      {Object.entries(inputs).map(([key, value]) => (
        <Text key={key}>{key}: {String(value.value)} (Type: {value.type})</Text>
      ))}
    </Box>
  );

  const renderOutputs = (outputs: Record<string, { value: unknown, type: string }>) => (
    <Box mt="md">
      <Title order={4}>Outputs:</Title>
      {Object.entries(outputs).map(([key, value]) => (
        <Text key={key}>{key}: {String(value.value)} (Type: {value.type})</Text>
      ))}
    </Box>
  );

  const renderTerminalOutput = (stdout: string) => (
    stdout && (
      <Box mt="md">
        <Title order={4}>Terminal Output:</Title>
        <ScrollArea h={150} mt="xs">
          <Text style={{ whiteSpace: 'pre-wrap' }}>{stdout}</Text>
        </ScrollArea>
      </Box>
    )
  );

  const renderErrorOutput = (error: string) => (
    error && (
      <Box mt="md">
        <Title order={4}>Error:</Title>
        <ScrollArea h={150} mt="xs">
          <Text style={{ whiteSpace: 'pre-wrap', color: theme.colors.red[6] }}>{error}</Text>
        </ScrollArea>
      </Box>
    )
  );


  return (
    <>
    <PanelResizeHandle style={{ backgroundColor: 'var(--mantine-color-dark-2)', width: '0.075rem' }} />
    <Panel 
      id="inspector" 
      order={2} 
      defaultSize={25}
      maxSize={75}
      minSize={20}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0', margin: '0' }}
    >
      <Flex direction="row" justify="space-between" align="center" w="100%" pl='0.5rem' pt='0.3rem' pr='0.35rem' m='0' mb='0.3rem' pb='0rem'>
        <Title order={3}>Inspector</Title>
        <ActionIcon variant="subtle" color={isLocked ? 'red.5': 'dark.3'} onClick={toggleLock}>
          {isLocked ? <IconLockFilled/> : <IconLockOpen />}
        </ActionIcon>
      </Flex>
      <Divider orientation='horizontal' color='dark.3' w='100%'/>
      <ScrollArea h="100%" w="100%" p='0.5rem' m='0'>
        <Flex direction="column" m='0' p={0}>
          {selectedNode ? (
            <>
              <Flex direction="row" w="100%" justify="space-between">
                <Title order={3} mb="md">{`Node: ${selectedNodeData.name.replace('Node', '')}`}</Title>
                <Flex direction="column" justify="flex-end" align="flex-end">
                  <Badge color={getStatusColor(selectedNodeData.status, theme)}>
                    {selectedNodeData.status}
                  </Badge>
                  <Text size="xs" mb="md">{`ID: ${selectedNode.id}`}</Text>
                </Flex>
              </Flex>
              
              {renderInputs(selectedNodeData.inputs)}
              {renderOutputs(selectedNodeData.outputs)}
              {renderTerminalOutput(selectedNodeData.terminal_output)}
              {renderErrorOutput(selectedNodeData.error_output)}
            </>
          ) : (
            <Text>No node selected</Text>
          )}
        </Flex>
      </ScrollArea>
    </Panel>
    </>
  );
}

export default InspectorPanel;