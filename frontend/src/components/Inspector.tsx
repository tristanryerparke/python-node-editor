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
  Image as MantineImage 
} from '@mantine/core'  
import { IconLockOpen, IconLockFilled } from '@tabler/icons-react';
import { useContext } from 'react';
import { NodeSelectionContext, InspectorContext } from '../GlobalContext';
import { useNodes } from '@xyflow/react';
import { getStatusColor } from '../utils/Colors';
import type { BaseNodeData, NodeInput, NodeOutput, Image } from '../types/DataTypes';

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


  const renderInputs = (inputs: NodeInput[]) => (
    <Flex w="100%" direction="column">
      <Title order={4}>Inputs:</Title>
      {inputs.map((input) => {
        if (input.type === 'image' && input.value) {
          const imageValue = input.value as Image;
          return (
            <Flex direction="column" key={input.label} w="100%" pb='0.5rem'>
              <Text fw={700} span>{input.label}:</Text> <Text span>{imageValue.description}</Text>
              {imageValue.thumbnail && (
                <MantineImage fit="contain" src={imageValue.thumbnail} alt={`${input.label} preview`} w="100%" h="100%" />
              )}
            </Flex>
          );
        }
        return (
          <Text key={input.label}>
            <Text fw={700} span>{input.label}:</Text> <Text span>{String(input.value)} (Type: {input.type}) </Text>
          </Text>
        );
      })}
    </Flex>
  );

  const renderOutputs = (outputs: NodeOutput[]) => (
    <Box mt="md" w="100%">
      <Title order={4}>Outputs:</Title>
      {outputs.map((output) => {
        if (output.type === 'image' && output.value) {
          const imageValue = output.value as Image;
          return (
            <Flex direction="column" key={output.label} w="100%" pb='0.5rem'>
              <Text fw={700} span>{output.label}:</Text> <Text span>{imageValue.description}</Text>
              {imageValue.thumbnail && (
                <MantineImage fit="contain" src={imageValue.thumbnail} alt={`${output.label} preview`} w="100%" h="100%" />
              )}
            </Flex>
          );
        }
        return (
          <Text key={output.label}>
            <Text fw={700} span>{output.label}</Text>: {String(output.value)} (Type: {output.type})
          </Text>
        );
      })}
    </Box>
  );

  const renderTerminalOutput = (stdout: string) => (
    stdout && (
      <Box mt="md" w="100%">
        <Title order={4}>Terminal Output:</Title>
        <ScrollArea h={150} mt="xs">
          <Text style={{ whiteSpace: 'pre-wrap' }}>{stdout}</Text>
        </ScrollArea>
      </Box>
    )
  );

  const renderErrorOutput = (error: string) => (
    error && (
      <Box mt="md" w="100%">
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
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '0px', 
        margin: '0px', 
        overflow: 'hidden'
      }}
    >
      <Flex 
        direction="row" 
        justify="space-between" 
        align="center" 
        w="100%" 
        pl='0.5rem' 
        pt='0.3rem' 
        pr='0.35rem' 
        m={0}
        mb='0.3rem' 
        pb={0}
      >
        <Title order={3}>Inspector</Title>
        <ActionIcon variant="subtle" color={isLocked ? 'red.5': 'dark.3'} onClick={toggleLock}>
          {isLocked ? <IconLockFilled/> : <IconLockOpen />}
        </ActionIcon>
      </Flex>
      <Divider orientation='horizontal' color='dark.3' w='100%'/>
      <Flex direction="row" w="100%" h="100%" m={0} p='0.5rem' gap='0.5rem' style={{ overflowY: 'auto' }}>

          <Flex direction="column" m={0} p={0} w="100%" >
            {selectedNode ? (
              <>
                <Flex direction="row" align="center" justify="space-between">
                  <Title order={3}>{`Node: ${selectedNodeData.name.replace('Node', '')}`}</Title>
                  <Badge color={getStatusColor(selectedNodeData.status, theme)}>
                    {selectedNodeData.status}
                  </Badge>
                </Flex>
                <Text size="xs" mb="md">{`ID: ${selectedNode.id}`}</Text>
                <Flex direction="column" w="100%">
                {renderInputs(selectedNodeData.inputs)}
                {renderOutputs(selectedNodeData.outputs)}
                {renderTerminalOutput(selectedNodeData.terminal_output)}
                {renderErrorOutput(selectedNodeData.error_output)}
                </Flex>
              </>
            ) : (
              <Text>No node selected</Text>
            )}
          </Flex>
      </Flex>
    </Panel>
    </>
  );
}

export default InspectorPanel;