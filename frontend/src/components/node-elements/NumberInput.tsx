import React, { useEffect, useState } from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';
import { NumberInput as MantineNumberInput, Group, Text, Flex } from '@mantine/core';

interface NumberInputProps {
  handleId: string;
  label: string;
  defaultValue: number | null;
  value: number;
  type: string;
  onChange: (value: number) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({ handleId, label, defaultValue, value, type, onChange }) => {
  const edges = useEdges();
  const [isEdgeConnected, setisEdgeConnected] = useState(false);

  useEffect(() => {
    const edge = edges.find(edge => edge.targetHandle === handleId);
    if (edge) {
      setisEdgeConnected(true);
    } else {
      setisEdgeConnected(false);
    }
  }, [edges, handleId]);

  const handleChange = (newValue: string | number) => {
    if (typeof newValue === 'number') {
      onChange(newValue);
    }
  };

  return (
    <Flex style={{position: 'relative'}} align='center' justify='space-between' w='100%'>
      <Handle
        type="target"
        position={Position.Left}
        id={handleId}
        style={{ 
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '50%',
          backgroundColor: 'blue',
          position: 'absolute',
          transform: 'translateX(-0.85rem) translateY(-30%)'
        }}
      />
      <Group pl="0.25rem" gap="0.2rem" w='100%'>
        <Text pr="0.25rem">{label}</Text>
        
        
        {!isEdgeConnected && (
        <MantineNumberInput
          size="xs"
          value={value}
          defaultValue={defaultValue ?? undefined}
          onChange={handleChange}
          style={{ flex: 1 }}
          disabled={isEdgeConnected}
          allowDecimal={type !== 'integer'}
          />
        )}
      </Group>
    </Flex>
  );
};

export default NumberInput;