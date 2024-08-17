import { memo, useCallback, useContext } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Paper, Text, Box, Divider, Flex } from '@mantine/core';
import NumberInput from './node-elements/NumberInput';
import TextInput from './node-elements/TextInput';
import NumberOutput from './node-elements/NumberOutput';
import TextOutput from './node-elements/TextOutput';
import NodeTopBar from './node-elements/NodeTopBar';
import { NodeSelectionContext, AutoExecuteContext } from '../GlobalContext';
import { useExecutionManager } from '../hooks/useExecutionManager';

export interface NodeData {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  description: string;
  inputs: Record<string, { type: string; default: any; value: any }>;
  outputs: Record<string, { type: string; value: any }>;
  streaming: boolean;
  status: string;
}

export interface OutputData {
  value: any;
  type: string;
}

const CustomNode: React.FC<NodeProps> = memo(({ data, id }) => {
  const reactFlow = useReactFlow();
  const { autoExecute } = useContext(AutoExecuteContext);
  const { debouncedExecute } = useExecutionManager();

  const updateNodeData = useCallback((inputKey: string, value: any) => {
    const newData = {
      ...data,
      inputs: {
        ...data.inputs,
        [inputKey]: {
          ...data.inputs[inputKey],
          value: value
        }
      }
    };

    if (data.status === 'evaluated') {
      newData.status = 'not evaluated';
      newData.outputs = Object.fromEntries(
        Object.entries(data.outputs).map(([key, output]) => [key, { ...output, value: null }])
      );
    }

    reactFlow.setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: newData,
          };
        }
        return node;
      })
    );

    if (autoExecute) {
      debouncedExecute();
    }
  }, [data, id, reactFlow, autoExecute, debouncedExecute]);

  const renderInputComponent = (key: string, input: any) => {
    if (!input) return null;

    const commonProps = {
      handleId: `${id}-input-${key}`,
      label: key,
      value: input.value ?? input.default ?? '',
      onChange: (value: any) => updateNodeData(key, value),
      type: input.type
    };

    switch (input.type) {
      case 'float':
      case 'number':
      case 'int':
        return <NumberInput key={`${id}-input-${key}`} {...commonProps} />;
      case 'str':
        return <TextInput key={`${id}-input-${key}`} {...commonProps} />;
      default:
        return null;
    }
  };

  const renderOutputComponent = (key: string, output: any) => {
    const commonProps = {
      handleId: `${id}-output-${key}`,
      label: key,
      value: output.value ?? '',
      type: output.type
    };

    switch (output.type) {
      case 'number':
      case 'int':
        return <NumberOutput key={`${id}-output-${key}`} {...commonProps} />;
      case 'str':
        return <TextOutput key={`${id}-output-${key}`} {...commonProps} />;
    }
  };

  const { name, inputs, outputs, description, status } = data as NodeData;

  const { selectedNodeId } = useContext(NodeSelectionContext);

  const getBorderStyle = () => {
    if (status === 'executing' ) {
      return '2px solid var(--mantine-color-green-5)';
    } else if (status === 'streaming') {
      return '2px solid var(--mantine-color-indigo-5)';
    } else if (id === selectedNodeId) {
      return '2px solid var(--mantine-color-blue-2)';
    }
    return 'none';
  };

  return (
    <Paper
      p='0'
      radius="md"
      bg="dark.5"
      miw='10rem'
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
      <NodeTopBar id={id} />
      <Divider orientation='horizontal' color='dark.3' w='100%'/>

      <Flex direction='column' gap='0.5rem' p='0.5rem' w='100%'>
        {Object.entries(data.inputs || {}).map(([key, input]) => renderInputComponent(key, input))}
      </Flex>

      <Divider orientation='horizontal' color='dark.3' w='100%'/>

      <Flex direction='column' gap='0.5rem' p='0.5rem' w='100%'>
        {Object.entries(outputs).map(([key, output]) => 
          !(data.streaming && key === 'status') && renderOutputComponent(key, output)
        )}
      </Flex>
    </Paper>
  );
});

export default CustomNode;