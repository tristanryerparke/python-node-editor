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
import React, { useContext, useState, useCallback } from 'react';
import { InspectorContext } from '../../GlobalContext';
import { useNodes, useReactFlow } from '@xyflow/react';
import { getStatusColor } from '../../utils/Colors';
import type { BaseNodeData, InputNodeField, NodeField, OutputNodeField } from '../../types/DataTypes';
import InputFieldDisplay from '../node-elements/InputFieldDisplay';
import OutputFieldDisplay from '../node-elements/OutputFieldDisplay';
import { FieldDisplayContext } from '../node-elements/CustomNode';

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
  const focusedNode = nodes.find(node => node.id === nodeToDisplay);
  const focusedNodeData = focusedNode?.data as unknown as BaseNodeData;

  const reactFlow = useReactFlow();

  const setField = useCallback(
    (fieldIndex: number, field: InputNodeField | OutputNodeField, type: 'input' | 'output') => {
      const newData = { ...focusedNodeData };
      if (type === 'input') {
        newData.inputs = [...newData.inputs];
        newData.inputs[fieldIndex] = field as InputNodeField;
      } else {
        newData.outputs = [...newData.outputs];
        newData.outputs[fieldIndex] = field as OutputNodeField;
      }
      reactFlow.setNodes((nds) =>
        nds.map((node) => (node.id === focusedNode?.id ? { ...node, data: newData } : node))
      );
    },
    [focusedNodeData, reactFlow, focusedNode?.id]
  );

  const renderInputs = (inputs: NodeField[]) => (
    <Paper withBorder m='0.5rem' radius='md'>
      <Flex direction="column" w="100%" className='inspector-inputs'>
        <Title ml='0.5rem' py='0.25rem' order={4}>Inputs:</Title>
        <Divider color='dark.3' />
        {inputs.map((field, index) => (
          <React.Fragment key={field.label}>
            <Flex direction='column' w="100%" p='0.5rem' m={0}>
              <FieldDisplayContext.Provider value='inspector'>
                <InputFieldDisplay 
                  field={field} 
                  setField={setField}
                />
              </FieldDisplayContext.Provider>
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
              <FieldDisplayContext.Provider value='inspector'>
                <OutputFieldDisplay 
                  field={output} 
                  setField={setField}
                />
              </FieldDisplayContext.Provider>
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
            {focusedNode ? (
              <>
                <Flex direction="row" align="center" justify="space-between" p='0.5rem'>
                  <Title order={3}>{`Node: ${focusedNodeData.display_name}`}</Title>
                  <Badge color={getStatusColor(focusedNodeData.status, theme)}>
                    {focusedNodeData.status}
                  </Badge>
                </Flex>
                <Text px='0.5rem' size="xs">{`ID: ${focusedNode.id}`}</Text>
                <Divider orientation='horizontal' color='dark.3' size='sm' w='100%'/>
                <Flex direction="column" w="100%" p={0} m={0}>
                  {renderInputs(focusedNodeData.inputs)}
                  <Divider color='dark.3' />
                  {renderOutputs(focusedNodeData.outputs)}
                  <Divider color='dark.3' />
                  {renderTerminalAndErrorOutput(focusedNodeData.terminal_output, focusedNodeData.error_output)}
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
    </>
  );
}

export default InspectorPanel;
