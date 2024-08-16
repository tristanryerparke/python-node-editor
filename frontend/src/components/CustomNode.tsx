import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Paper, Text, Box, Divider, Group, ActionIcon, Flex } from '@mantine/core';
import NumberInput from './node-elements/NumberInput';
import { IconInfoCircle, IconCode, IconCheck } from '@tabler/icons-react';
import NodeTopBar from './node-elements/NodeTopBar';

export interface NodeData {
  id: number;
  name: string;
  type: string;
  position: { x: number; y: number };
  description: string;
  inputs: Record<string, { type: string; default: number; value: number }>;
  outputs: Record<string, any>;
  streaming: boolean;
}

interface InputType {
  type: string;
  default: number;
  value: number;
}

const CustomNode: React.FC<NodeProps<NodeData>> = memo(({ data, id }) => {
  const updateNodeData = useCallback((inputKey: string, value: number) => {
    data.inputs[inputKey].value = value;
  }, [data]);

  const { name, inputs, outputs, description } = data as NodeData;

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
      }}
    >
      <NodeTopBar name={name} streaming={data.streaming}/>
      <Divider orientation='horizontal' color='dark.3' w='100%'/>

      <Box p='0.5rem' w='100%'>
        {description && (
          <Text size="xs" fw={500} mb="0.5rem">
            {description}
          </Text>
        )}
        {Object.entries(data.inputs).map(([key, input], index) => (
          <Flex
            key={`input-${id}-${key}`} 
            align='flex-start'
            mb='0.5rem'
            w='100%'
            h='2rem'
          >
            <NumberInput 
              handleId={`${data.id}-input-${key}`}
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

      <Box>
        <Text size="sm" fw={500}>Outputs:</Text>
        {Object.entries(outputs).map(([key, type], index) => (
          <Box key={`output-${id}-${key}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px', position: 'relative' }}>
            <Text size="xs">{key}: {type}</Text>
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
                right: '-1.35rem'
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
});

export default CustomNode;