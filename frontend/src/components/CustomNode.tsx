import { memo, useCallback, useContext } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Paper, Text, Box, Divider, Flex } from '@mantine/core';
import NumberInput from './node-elements/NumberInput';
import NodeTopBar from './node-elements/NodeTopBar';
import { NodeSelectionContext } from '../GlobalContext';

export interface NodeData {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  description: string;
  inputs: Record<string, { type: string; default: any; value: any }>;
  outputs: Record<string, any>;
  streaming: boolean;
  status: string;
}

const CustomNode: React.FC<NodeProps> = memo(({ data, id }) => {
  const reactFlow = useReactFlow();

  const updateNodeData = useCallback((inputKey: string, value: number) => {
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
        Object.entries(data.outputs).map(([key, _]) => [key, null])
      );
    }

    reactFlow.updateNodeData(id, newData);
  }, [data, id, reactFlow]);

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
      }}
    >
      <NodeTopBar id={id} />
      <Divider orientation='horizontal' color='dark.3' w='100%'/>

      <Box p='0.5rem' w='100%'>
        {description && (
          <Text size="xs" fw={500} mb="0.5rem">
            {description}
          </Text>
        )}
        {Object.entries(inputs).map(([key, input], index) => (
          <Flex
            key={`input-${id}-${key}`} 
            align='flex-start'
            mb='0.5rem'
            w='100%'
            h='2rem'
          >
            <NumberInput 
              handleId={`${id}-input-${key}`}
              label={key}
              defaultValue={input.default}
              value={input.value}
              type={input.type}
              onChange={(value) => updateNodeData(key, value)}
              key={`${id}-input-${key}`}
            />    
          </Flex>
        ))}
      </Box>

      <Box p='0.5rem' w='100%'>
        <Text size="sm" fw={500}>Outputs:</Text>
        {Object.entries(outputs).map(([key, type], index) => (
          <Box key={`output-${id}-${key}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px', position: 'relative' }}>
            <Text size="xs">{key}: {type === null ? 'none' : type}</Text>
            <Handle
              type="source"
              position={Position.Right}
              id={`output-${key}`}
              style={{ 
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: 'red',
                position: 'absolute',
                right: '-0.5rem'
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
});

export default CustomNode;