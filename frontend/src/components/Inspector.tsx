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
  Image as MantineImage ,
  Modal,
  Loader,
} from '@mantine/core'  
import { useDisclosure } from '@mantine/hooks';
import { IconLockOpen, IconLockFilled, IconEye } from '@tabler/icons-react';
import { useContext } from 'react';
import { NodeSelectionContext, InspectorContext } from '../GlobalContext';
import { useNodes } from '@xyflow/react';
import { getStatusColor } from '../utils/Colors';
import type { BaseNodeData, NodeInput, NodeOutput, Data } from '../types/DataTypes';
import { useState, useCallback } from 'react';
import axios from 'axios';

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

  const [opened, { open, close }] = useDisclosure(false);
  const [modalImage, setModalImage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openModal = useCallback(async (nodeId: string, inputOrOutput: 'input' | 'output', label: string) => {
    setIsLoading(true);
    open();
    setModalTitle(label);
    try {
      const response = await axios.get(`http://localhost:8000/image/${nodeId}/${inputOrOutput}/${label}`);
      setModalImage(response.data.image);
    } catch (error) {
      console.error('Error fetching image:', error);
      setModalImage(''); // Clear the image in case of error
    } finally {
      setIsLoading(false);
    }
  }, [open]);

  const renderImageItem = (item: NodeInput | NodeOutput, inputOrOutput: 'input' | 'output') => {
    
    const dataWithImage = (inputOrOutput === 'input' 
      ? (item as NodeInput).input_data
      : (item as NodeOutput).output_data) as Data;


    return (
      <Flex direction="column" key={item.label} w="100%" pb='0.5rem'>
        <Text fw={700} span>{item.label}:</Text> <Text span>{dataWithImage.description}</Text>
        {dataWithImage.data && typeof dataWithImage.data === 'string' && (
          <MantineImage fit="contain" src={`data:image/jpeg;base64,${dataWithImage.data}`} alt={`${item.label} preview`} w="100%" h="100%" />
        )}
        <ActionIcon 
          style={{ position: 'relative', top: -30, right: -2 }} 
          variant="subtle" 
          color="dark.3"
          onClick={() => selectedNode && openModal(selectedNode.id, inputOrOutput, item.label)}
        >
          <IconEye />
        </ActionIcon>
      </Flex>
    );
  };

  const renderInputs = (inputs: NodeInput[]) => (
    <Flex w="100%" direction="column">
      <Title order={4}>Inputs:</Title>
      {inputs.map((input) => {
        if (input.type === 'image' && input.input_data) {
          return renderImageItem(input, 'input');
        }
        return (
          <Text key={input.label}>
            <Text fw={700} span>{input.label}:</Text> <Text span>{String(input.input_data?.data)} (Type: {input.type}) </Text>
          </Text>
        );
      })}
    </Flex>
  );

  const renderOutputs = (outputs: NodeOutput[]) => (
    <Box mt="md" w="100%">
      <Title order={4}>Outputs:</Title>
      {outputs.map((output) => {
        if (output.type === 'image' && output.output_data) {
          return renderImageItem(output, 'output');
        }
        return (
          <Text key={output.label}>
            <Text fw={700} span>{output.label}</Text>: {String(output.output_data?.data)} (Type: {output.type})
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
    <Modal 
      size="auto" 
      centered 
      opened={opened} 
      onClose={close} 
      title={modalTitle}
      withinPortal={false}
    >
      {isLoading ? (
        <Flex justify="center" align="center" style={{ width: '300px', height: '300px' }}>
          <Loader size="xl" />
        </Flex>
      ) : (
        <MantineImage src={modalImage} alt={modalTitle} fit="contain" />
      )}
    </Modal>
    </>
  );
}

export default InspectorPanel;