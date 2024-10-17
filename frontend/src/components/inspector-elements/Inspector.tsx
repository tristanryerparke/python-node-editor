import { Panel, PanelResizeHandle } from 'react-resizable-panels';
import { 
  Flex, 
  Text, 
  Title, 
  Badge, 
  useMantineTheme, 
  ScrollArea, 
  Divider, 
  ActionIcon,
  Image as MantineImage ,
  Modal,
  Loader,
  Paper,
} from '@mantine/core'  
import { useDisclosure } from '@mantine/hooks';
import { IconLockOpen, IconLockFilled, IconEye } from '@tabler/icons-react';
import React, { useContext, useState, useCallback, useEffect } from 'react';
import { InspectorContext } from '../../GlobalContext';
import { useNodes, useReactFlow } from '@xyflow/react';
import { getStatusColor } from '../../utils/Colors';
import type { BaseNodeData, NodeField } from '../../types/DataTypes';
import InputFieldDisplay from '../node-elements/InputFieldDisplay';
import OutputFieldDisplay from '../node-elements/OutputFieldDisplay';

function InspectorPanel() {
  const { isLocked, setIsLocked, lockedNodeId, setLockedNodeId, selectedNodeId } = useContext(InspectorContext);
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

  const reactFlow = useReactFlow();

  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedNodeData) {
      setExpandedStates(prevStates => {
        const newStates = { ...prevStates };
        selectedNodeData.inputs.forEach(input => {
          if (!(input.id in newStates)) {
            newStates[input.id] = true; // Default to expanded for inputs in inspector
          }
        });
        selectedNodeData.outputs.forEach(output => {
          if (!(output.id in newStates)) {
            newStates[output.id] = true; // Default to expanded for outputs in inspector
          }
        });
        return newStates;
      });
    }
  }, [selectedNodeData]);

  const setExpanded = useCallback((fieldId: string, expanded: boolean) => {
    setExpandedStates(prev => ({
      ...prev,
      [fieldId]: expanded
    }));
  }, []);

  const updateNodeData = useCallback((field: NodeField, value?: unknown, metadata?: Record<string, unknown>) => {
    const newData = { ...selectedNodeData };
    const inputIndex = newData.inputs.findIndex((input: NodeField) => input.label === field.label);
    if (inputIndex !== -1) {
      if (value === undefined && metadata === undefined) {
        // Replace the entire field
        newData.inputs[inputIndex] = field;
      } else {
        // Update specific parts of the field
        newData.inputs[inputIndex] = { 
          ...newData.inputs[inputIndex], 
          data: value !== undefined ? value : newData.inputs[inputIndex].data, 
          metadata: metadata ? { ...newData.inputs[inputIndex].metadata, ...metadata } : newData.inputs[inputIndex].metadata
        };
      }
    }
    // Commented out as per CustomNode.tsx
    // newData.outputs = newData.outputs.map(output => ({ ...output, data: null }));
    // newData.status = 'not evaluated';

    reactFlow.setNodes((nds) =>
      nds.map((node) => (node.id === selectedNode?.id ? { ...node, data: newData } : node))
    );
  }, [selectedNodeData, reactFlow, selectedNode?.id]);

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
    <Paper withBorder m='0.5rem' radius='md'>
      <Flex direction="column" w="100%" className='inspector-inputs'>
        <Title ml='0.5rem' py='0.25rem' order={4}>Inputs:</Title>
        <Divider color='dark.3' />
        {inputs.map((input, index) => (
          <React.Fragment key={input.label}>
            <Flex direction='column' w="100%" p='0.5rem' m={0}>
              <InputFieldDisplay 
                field={input} 
                onChange={(field, value, metadata) => updateNodeData(field, value, metadata)}
                expanded={expandedStates[input.id] ?? true}
                setExpanded={(expanded) => setExpanded(input.id, expanded)}
                disabled={false}
              />
            </Flex>
            {index < inputs.length - 1 && <Divider variant='dashed' color='dark.3' />}
          </React.Fragment>
        ))}
      </Flex>
    </Paper>
  );

  const renderOutputs = (outputs: NodeField[]) => (
    <Paper withBorder m='0.5rem' radius='md'>
      <Flex direction="column" w="100%" className='inspector-outputs'>
        <Title ml='0.5rem' py='0.25rem' order={4}>Outputs:</Title>
        <Divider color='dark.3' />
        {outputs.map((output, index) => (
          <React.Fragment key={output.label}>
            <Flex direction='column' w='100%' p='0.5rem' m={0}>
              <OutputFieldDisplay 
                field={output} 
                expanded={expandedStates[output.id] ?? true}
                setExpanded={(expanded) => setExpanded(output.id, expanded)}
              />
            </Flex>
            {index < outputs.length - 1 && <Divider variant='dashed' color='dark.3' />}
          </React.Fragment>
        ))}
      </Flex>
    </Paper>
  );

  const renderTerminalAndErrorOutput = (stdout: string, error: string) => {
    return (
      <Flex direction="column" w="100%" px='0.5rem' m={0}>
        <Title order={4}>Terminal Output</Title>
        <ScrollArea h={150} mt="xs">
          <Text style={{ whiteSpace: 'pre-wrap' }}>
            {stdout}
            {error && (
              <>
                {stdout && '\n'}
                <span style={{ color: theme.colors.red[6] }}>{error}</span>
              </>
            )}
          </Text>
        </ScrollArea>
      </Flex>
    );
  };


  return (
    <>
    <PanelResizeHandle style={{ backgroundColor: 'var(--mantine-color-dark-2)', width: '0.075rem' }} />
    <Panel 
      id="inspector" 
      order={2} 
      defaultSize={25}
      maxSize={45}
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
      >
        <Title order={3}>Inspector</Title>
        <ActionIcon variant="subtle" color={isLocked ? 'red.5': 'dark.3'} onClick={toggleLock}>
          {isLocked ? <IconLockFilled/> : <IconLockOpen />}
        </ActionIcon>
      </Flex>
      <Divider orientation='horizontal' color='dark.3' size='sm' w='100%'/>
      <Flex direction="row" w="100%" h="100%" m={0} p={0} gap='0.5rem' style={{ overflowY: 'auto' }}>

          <Flex direction="column" m={0} p={0} w="100%" >
            {selectedNode ? (
              <>
                <Flex direction="row" align="center" justify="space-between" p='0.5rem'>
                  <Title order={3}>{`Node: ${selectedNodeData.display_name}`}</Title>
                  <Badge color={getStatusColor(selectedNodeData.status, theme)}>
                    {selectedNodeData.status}
                  </Badge>
                </Flex>
                <Text px='0.5rem' size="xs">{`ID: ${selectedNode.id}`}</Text>
                <Divider orientation='horizontal' color='dark.3' size='sm' w='100%'/>
                <Flex direction="column" w="100%" p={0} m={0}>
                  {renderInputs(selectedNodeData.inputs)}
                  <Divider color='dark.3' />
                  {renderOutputs(selectedNodeData.outputs)}
                  <Divider color='dark.3' />
                  {renderTerminalAndErrorOutput(selectedNodeData.terminal_output, selectedNodeData.error_output)}
                </Flex>
              </>
            ) : (
              <Flex direction="column" align="center" justify="center" w="100%" h="100%">
                <Text>No node selected</Text>
              </Flex>
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
