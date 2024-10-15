import React, { memo, useCallback, useContext } from 'react';
import { Node, NodeProps, useReactFlow, useStore } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Resizable } from 're-resizable';
import { Paper, Divider, Flex, useMantineTheme } from '@mantine/core';
import NodeTopBar from './NodeTopBar';
import { InspectorContext } from '../../GlobalContext';
import { BaseNodeData, NodeField } from '../../types/DataTypes';
import OutputFieldDisplay from './OutputFieldDisplay';
import InputFieldDisplay from './InputFieldDisplay';

type CustomNodeData = Node<BaseNodeData & Record<string, unknown>>;

export default memo(function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
  const reactFlow = useReactFlow();
  const theme = useMantineTheme();  

  // Get edges from the React Flow store
  const edges = useStore((state) => state.edges);

  // For when the user changes the value of an input field
  // Updates the field data based on the id and clears node outputs
  const updateNodeData = useCallback((field: NodeField, value: string, metadata: Record<string, unknown> = {}) => {
    console.log('Updating node data:', field, value);
    const newData = { ...data };
    const inputIndex = newData.inputs.findIndex((input: NodeField) => input.label === field.label);
    if (inputIndex !== -1) {
      newData.inputs[inputIndex] = { 
        ...newData.inputs[inputIndex], 
        data: value, 
        metadata: { ...newData.inputs[inputIndex].metadata, ...metadata }
      };
    }
    // newData.outputs = newData.outputs.map(output => ({ ...output, data: null }));
    // newData.status = 'not evaluated';

    reactFlow.setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, data: newData } : node))
    );
  }, [data, reactFlow, id]);

  

  function renderInputComponent(inputField: NodeField) {
    const handleId = `${id}-input-${inputField.label}`;
    const isEdgeConnected = edges.some(edge => edge.targetHandle === handleId);

    return (
    <Flex 
      key={handleId}
      py='0.25rem'
      style={{position: 'relative'}} 
      align='center' 
      justify='space-between' 
      w='100%'
    > 
      <Flex direction='column' w='100%' pl='0.75rem' pr='0.5rem'>
        <InputFieldDisplay 
          field={inputField} 
          onChange={updateNodeData}
          expanded={false}
          disabled={isEdgeConnected}
          />
      </Flex>
      
      <Handle
        type="target"
        id={handleId}
        position={Position.Left}
        style={{ 
          width: '1rem',
          height: '1rem',
          borderRadius: '50%',
          border: '2px solid',
          borderColor: theme.colors.dark[2],
          backgroundColor: theme.colors.dark[5],
          zIndex: 1000,
        }}
      />
    </Flex>
    );
  }

  const renderOutputComponent = (outputField: NodeField) => {
    const handleId = `${id}-output-${outputField.label}`;
    return (
      <Flex 
        key={`${id}-output-${outputField.id}`}
        px='0.25rem'
        style={{position: 'relative'}} 
        py='0.25rem'
        my='auto' 
        align='center' 
        justify='space-between' 
        w='100%'
      >
        <Flex direction='column' w='100%' pr='0.75rem' pl='0.5rem'>
          <OutputFieldDisplay 
            field={outputField} 
          defaultExpanded={false}
        />
        </Flex>
        <Handle
          type="source"
          id={handleId}
          position={Position.Right}
          style={{ 
            width: '1rem',
            height: '1rem',
            borderRadius: '50%',
            border: '2px solid',
            borderColor: theme.colors.dark[2],
            backgroundColor: theme.colors.dark[5],
            zIndex: 1000,
          }}
        />
      </Flex>
    );
  };

  const { selectedNodeId } = useContext(InspectorContext);

  const getBorderStyle = () => {
    if (data.status === 'executing' ) {
      return '2px solid var(--mantine-color-green-5)';
    } else if (data.status === 'streaming') {
      return '2px solid var(--mantine-color-indigo-5)';
    } else if (id === selectedNodeId) {
      return '2px solid var(--mantine-color-blue-2)';
    }
    return 'none';
  };

  return (
    <Resizable
      defaultSize={{
        width: 250,
      }}
      minWidth={200}
      enable={{
        top: false,
        right: true,
        bottom: false,
        left: true,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false
      }}
      handleClasses={{
        right: 'nodrag',
        left: 'nodrag',
      }}
    >
      <Paper
        p='0'
        radius="md"
        bg="dark.5"
        w='100%'
        h='100%'
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          outline: getBorderStyle(),
          outlineOffset: '-2px',
          transition: 'outline 0.25s ease-in-out',
        }}
      >
        <NodeTopBar id={id}/>
        <Divider orientation='horizontal' color='dark.3' size='sm' w='100%'/>

        <Flex direction='column' gap='0' w='100%'>
          {data.inputs.map((inputField, index) => (
            <React.Fragment key={inputField.id}>
              {renderInputComponent(inputField)}
              {index < data.inputs.length - 1 && <Divider variant='dashed' color='dark.3' />}
            </React.Fragment>
          ))}
        </Flex>

        <Divider orientation='horizontal' color='dark.3' w='100%'/>

        <Flex direction='column' gap='0' w='100%'>
          {data.outputs.map((output, index) => (
            <React.Fragment key={output.id}>
              {!(data.streaming && output.label === 'status') && renderOutputComponent(output)}
              {index < data.outputs.length - 1 && <Divider variant='dashed' color='dark.3' />}
            </React.Fragment>
          ))}
        </Flex>
      </Paper>
    </Resizable>
  );
});
