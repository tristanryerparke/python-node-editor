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

function InspectorPanel() {
  const { selectedNodeId } = useContext(NodeSelectionContext);
  const { isLocked, setIsLocked, lockedNodeId, setLockedNodeId } = useContext(InspectorContext);
  const nodes = useNodes();
  const theme = useMantineTheme();

  const toggleLock = () => {
    setIsLocked(!isLocked);
    if (!isLocked) {
      setLockedNodeId(selectedNodeId);
    } else {
      setLockedNodeId(null);
    }
  };

  const nodeToDisplay = isLocked ? lockedNodeId : selectedNodeId;
  const selectedNode = nodes.find(node => node.id === nodeToDisplay);

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const renderInputs = (inputs) => (
    <Box>
      <Title order={4}>Inputs:</Title>
      {Object.entries(inputs).map(([key, value]) => (
        <Text key={key}>{key}: {value.value} (Type: {value.type}, Default: {value.default})</Text>
      ))}
    </Box>
  );

  const renderOutputs = (outputs) => (
    <Box mt="md">
      <Title order={4}>Outputs:</Title>
      {Object.entries(outputs).map(([key, value]) => (
        <Text key={key}>{key}: {value === null ? 'none' : value}</Text>
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
      <Flex direction="row" justify="space-between" align="center" mb="md" w="100%" pl='0.5rem' pt='0.3rem' pr='0.35rem' m='0' mb='0.3rem' pb='0rem'>
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
                <Title order={3} mb="md">{`Node: ${selectedNode.data.name.replace('Node', '')}`}</Title>
                <Flex direction="column" justify="flex-end" align="flex-end">
                  <Badge color={getStatusColor(selectedNode.data.status)}>
                    {selectedNode.data.status}
                  </Badge>
                  <Text size="xs" mb="md">{`ID: ${selectedNode.id}`}</Text>
                </Flex>
              </Flex>
              
              {renderInputs(selectedNode.data.inputs)}
              {renderOutputs(selectedNode.data.outputs)}
              {renderTerminalOutput(selectedNode.data.terminal_output)}
              {renderErrorOutput(selectedNode.data.error_output)}
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