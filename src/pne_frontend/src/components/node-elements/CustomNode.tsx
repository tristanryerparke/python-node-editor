import React, { memo, useCallback, useContext, useEffect, createContext } from 'react';
import { Node, NodeProps, useReactFlow, useStore } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Resizable } from 're-resizable';
import { Paper, Divider, Flex, useMantineTheme } from '@mantine/core';
import NodeTopBar from './NodeTopBar';
import { InspectorContext } from '../../GlobalContext';
import { BaseNodeData, InputNodeField, OutputNodeField } from '../../types/BaseDataTypes';
import OutputFieldDisplay from './OutputFieldDisplay';
import InputFieldDisplay from './InputFieldDisplay';

type CustomNodeData = Node<BaseNodeData & Record<string, unknown>>;

export const FieldIndexContext = createContext<number>(-1);
export const FieldDisplayContext = createContext<string>('node');

export default memo(function CustomNode({ data, id, width }: NodeProps<CustomNodeData>) {
  const reactFlow = useReactFlow();
  const theme = useMantineTheme();  

  // Get edges from the React Flow store
  const edges = useStore((state) => state.edges);

  // This gets passed down to lower components, mostly this is used to swap out or update field.data
  // But it can also be used to set the expanded state of a field, etc
  const setField = useCallback(
    (fieldIndex: number, field: InputNodeField | OutputNodeField) => {
      

      const newData = { ...data };

      newData.inputs = [...newData.inputs];
      newData.inputs[fieldIndex] = field as InputNodeField;

      
      reactFlow.setNodes((nds) =>
        nds.map((node) => (node.id === id ? { ...node, data: newData } : node))
      );
      console.log('setField', fieldIndex, field);
    },
    [data, reactFlow, id]
  );
  

  // Add an effect to update is_edge_connected when edges change
  useEffect(() => {
    const newData = { ...data };
    let hasChanges = false;

    // Update inputs
    newData.inputs = newData.inputs.map(input => {
      const handleId = `${id}-input-${input.label}`;
      const isConnected = edges.some(edge => edge.targetHandle === handleId);
      
      if (input.is_edge_connected !== isConnected) {
        hasChanges = true;
        return { ...input, is_edge_connected: isConnected };
      }
      return input;
    });

    // Update outputs
    newData.outputs = newData.outputs.map(output => {
      const handleId = `${id}-output-${output.label}`;
      const isConnected = edges.some(edge => edge.sourceHandle === handleId);
      
      if (output.is_edge_connected !== isConnected) {
        hasChanges = true;
        return { ...output, is_edge_connected: isConnected };
      }
      return output;
    });

    // Only update nodes if there were changes
    if (hasChanges) {
      reactFlow.setNodes((nds) =>
        nds.map((node) => (node.id === id ? { ...node, data: newData } : node))
      );
    }
  }, [edges, data, id, reactFlow]);

  function renderInputComponent(inputField: InputNodeField, index: number) {
    const handleId = `${id}-input-${inputField.label}`;
    
    return (
      <Flex 
        key={index}
        py='0.25rem'
        style={{position: 'relative'}} 
        align='center' 
        justify='space-between' 
        w='100%'
      > 
        <Flex direction='column' w='100%' pl='0.75rem' pr='0.5rem'>
          <FieldIndexContext.Provider value={index}> 
            <FieldDisplayContext.Provider value='node'>
              <InputFieldDisplay 
                field={inputField}
                setField={(fieldIndex, field) => setField(fieldIndex, field, 'input')}
              />
            </FieldDisplayContext.Provider>
          </FieldIndexContext.Provider>
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

  const renderOutputComponent = (outputField: OutputNodeField, index: number) => {
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
          <FieldIndexContext.Provider value={index}>
            <OutputFieldDisplay 
              field={outputField}
              setField={(fieldIndex, field) => setField(fieldIndex, field, 'output')}
            />
          </FieldIndexContext.Provider>
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
        width: width as number,
      }}
      minWidth={width as number}
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
              {renderInputComponent(inputField, index)}
              {index < data.inputs.length - 1 && <Divider key={`divider-${inputField.id}`} variant='dashed' color='dark.3' />}
            </React.Fragment>
          ))}
        </Flex>

        <Divider orientation='horizontal' color='dark.3' w='100%'/>

        <Flex direction='column' gap='0' w='100%'>
          {data.outputs.map((output, index) => (
            <React.Fragment key={output.id}>
              {!(data.streaming && output.label === 'status') && renderOutputComponent(output, index)}
              {index < data.outputs.length - 1 && <Divider key={`divider-${output.id}`} variant='dashed' color='dark.3' />}
            </React.Fragment>
          ))}
        </Flex>
      </Paper>
    </Resizable>
  );
});
