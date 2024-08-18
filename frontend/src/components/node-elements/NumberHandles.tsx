import React, { useEffect, useState } from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';
import { NumberInput, Group, Text, Flex, useMantineTheme, Tooltip, TextInput } from '@mantine/core';


interface NumberInputProps {
  handleId: string;
  label: string;
  value: number;
  type: string;
  onChange: (value: number) => void;
}

export const NumberInputHandle: React.FC<NumberInputProps> = ({ handleId, label, value, type, onChange }) => {
  const theme = useMantineTheme();
  const edges = useEdges();
  const [isEdgeConnected, setIsEdgeConnected] = useState(false);

  useEffect(() => {
    const edge = edges.find(edge => edge.targetHandle === handleId);
    setIsEdgeConnected(!!edge);
  }, [edges, handleId]);

  const handleChange = (newValue: string | number) => {
    if (typeof newValue === 'number') {
      onChange(newValue);
    }
  };

  return (
    <Flex style={{position: 'relative'}} my='auto' align='center' justify='space-between' w='100%'>
      <Tooltip label={type} color='dark.3' position='left' withArrow arrowSize={8}>
        <Handle
          type="target"
          position={Position.Left}
          id={handleId}
          style={{ 
            width: '1rem',
            height: '1rem',
            borderRadius: '50%',
            border: '2px solid',
            borderColor: theme.colors.dark[2],
            backgroundColor: theme.colors.dark[5],
            position: 'absolute',
            top: '0.375rem',
            transform: 'translateX(-1rem)'
          }}
        />
      </Tooltip>
      <Group pl="0.25rem" gap="0.2rem" w='100%' align='center'>
        <Text px="0.3rem">{label}</Text>
        <NumberInput
          size="xs"
          value={value}
          onChange={handleChange}
          style={{ flex: 1 }}
          disabled={isEdgeConnected}
          allowDecimal={type !== 'integer'}
        />
      </Group>
    </Flex>
  );
};


interface NumberOutputProps {
  handleId: string;
  label: string;
  value: number;
  type: string;
}

export const NumberOutputHandle: React.FC<NumberOutputProps> = ({ handleId, label, value, type }) => {
  const theme = useMantineTheme();

  return (
    <Flex style={{position: 'relative'}} my='auto' align='center' justify='space-between' w='100%'>
      <Group pr="0.25rem" gap="0.2rem" w='100%' align='center'>
        
        <TextInput
          size="xs"
          disabled
          value={value.toString()}
          readOnly
          
        />
        <Text px="0.3rem">{label}</Text>
      </Group>
      <Tooltip label={type} color='dark.3' position='right' withArrow arrowSize={8}>
        <Handle
          type="source"
          position={Position.Right}
          id={handleId}
          style={{ 
            width: '1rem',
            height: '1rem',
            borderRadius: '50%',
            border: '2px solid',
            borderColor: theme.colors.dark[2],
            backgroundColor: theme.colors.dark[5],
            position: 'absolute',
            top: '0.375rem',
            transform: 'translateX(1rem)'
          }}
        />
      </Tooltip>
    </Flex>
  );
};