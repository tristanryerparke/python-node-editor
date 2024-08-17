import React, { useEffect, useState } from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';
import { TextInput as MantineTextInput, Group, Text, Flex, useMantineTheme, Tooltip } from '@mantine/core';

interface TextInputProps {
  handleId: string;
  label: string;
  value: string;
  type: string;
  onChange: (value: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ handleId, label, value, type, onChange }) => {
  const theme = useMantineTheme();
  const edges = useEdges();
  const [isEdgeConnected, setIsEdgeConnected] = useState(false);

  useEffect(() => {
    const edge = edges.find(edge => edge.targetHandle === handleId);
    setIsEdgeConnected(!!edge);
  }, [edges, handleId]);


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
          backgroundColor: theme.colors.blue[5],
          position: 'absolute',
          top: '0.375rem',
          transform: 'translateX(-1rem)'
        }}
      />
      </Tooltip>
      <Group pl="0.25rem" gap="0.2rem" w='100%' align='center'>
        <Text px="0.3rem">{label}</Text>
        {!isEdgeConnected && (
          <MantineTextInput
            size="xs"
            value={value}
            onChange={(event) => onChange(event.currentTarget.value)}
            style={{ flex: 1 }}
            disabled={isEdgeConnected}
          />
        )}
      </Group>
    </Flex>
  );
};

export default TextInput;