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
import type { BaseNodeData, NodeField } from '../types/DataTypes';
import { useState, useCallback } from 'react';

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

  const openModal = useCallback(async (inputOrOutput: 'input' | 'output', label: string) => {
    setIsLoading(true);
    open();
    setModalTitle(label);
    try {
      const fieldItem = inputOrOutput === 'input' 
        ? selectedNodeData.inputs.find(input => input.label === label)
        : selectedNodeData.outputs.find(output => output.label === label);
      
      if (fieldItem && fieldItem.id) {
        const response = await fetch(`http://localhost:8000/full_data/${fieldItem.id}?dtype=${fieldItem.dtype}`);
        if (!response.ok) {
          throw new Error('Failed to fetch image data');
        }
        const imageData = await response.text();
        setModalImage(`data:image/jpeg;base64,${imageData.replace(/"/g, '')}`);
      } else {
        throw new Error('Image data ID not found');
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      setModalImage('');
    } finally {
      setIsLoading(false);
    }
  }, [open, selectedNodeData]);

  const renderImageItem = (fieldItem: NodeField, inputOrOutput: 'input' | 'output') => {


    return (
      <Flex direction="column" key={fieldItem.label} w="100%" pb='0.5rem'>
        <Text fw={700} span>{fieldItem.label}:</Text> <Text span>{fieldItem.description}</Text>
        {fieldItem.data && typeof fieldItem.data === 'string' && (
          <MantineImage fit="contain" src={`data:image/jpeg;base64,${fieldItem.data}`} alt={`${fieldItem.label} preview`} w="100%" h="100%" />
        )}
        <ActionIcon 
          style={{ position: 'relative', top: -30, right: -2 }} 
          variant="subtle" 
          color="dark.3"
          onClick={() => selectedNode && openModal(inputOrOutput, fieldItem.label)}
        >
          <IconEye />
        </ActionIcon>
      </Flex>
    );
  };

  const renderInputs = (inputs: NodeField[]) => (
    <Flex w="100%" direction="column">
      <Title order={4}>Inputs:</Title>
      {inputs.map((input) => {
        if (input.dtype === 'image' && input.data) {
          return renderImageItem(input, 'input');
        }
        return (
          <Text key={input.label}>
            <Text fw={700} span>{input.label} </Text>
            <Text span>({input.dtype}) : </Text>
            <Text span>{String(input.data ?? '')} </Text>
          </Text>
        );
      })}
    </Flex>
  );

  const renderOutputs = (outputs: NodeField[]) => (
    <Box mt="md" w="100%">
      <Title order={4}>Outputs:</Title>
      {outputs.map((output) => {
        if (output.dtype === 'image' && output.data) {
          return renderImageItem(output, 'output');
        }
        return (
          <Text key={output.label}>
            <Text fw={700} span>{output.label} </Text>
            <Text span>({output.dtype}) : </Text>
            <Text span>{String(output.data ?? '')} </Text>
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
                  <Title order={3}>{`Node: ${selectedNodeData.display_name}`}</Title>
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
      size="90%"
      centered 
      opened={opened} 
      onClose={close} 
      title={modalTitle}
      style={{overflow: 'hidden'}}
    >
      <Flex justify="center" align="center" w="100%" h="80%" style={{overflow: 'hidden', flexGrow: 1}}>
      {isLoading ? (
          <Loader color='dark.3' size="xl" />
      ) : (
        <MantineImage h="100%" src={modalImage} alt={modalTitle} fit="contain" />
      )}
    </Flex>
    </Modal>
    </>
  );
}

export default InspectorPanel;