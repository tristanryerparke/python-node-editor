import { useState, useEffect } from 'react';
import { TextInput, Tooltip, Group, Text, useMantineTheme, Flex } from '@mantine/core';
import { Handle, Position, useEdges } from '@xyflow/react';

interface ImageInputProps {
    handleId: string;
    label: string;
    value: { short_display: string, data: string } | undefined;
    type: string;
    onChange: (value: { short_display: string, data: string }) => void;
  }
  
  export const ImageInputHandle: React.FC<ImageInputProps> = ({ handleId, label, value, type, onChange }) => {
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
              backgroundColor: theme.colors.dark[5],
              position: 'absolute',
              top: '0.375rem',
              transform: 'translateX(-1rem)'
            }}
          />
        </Tooltip>
        <Group pl="0.25rem" gap="0.2rem" w='100%' align='center'>
          <Text px="0.3rem">{label}</Text>
          <TextInput
            size="xs"
            value={value?.short_display || ''}
            onChange={(e) => onChange({ short_display: e.target.value, data: value?.data || '' })}
            style={{ flex: 1 }}
            disabled={isEdgeConnected}
          />
        </Group>
      </Flex>
    );
  };

interface ImageOutputProps {
  handleId: string;
  label: string;
  value: { short_display: string, data: string } | undefined;
  type: string;
}

export const ImageOutputHandle: React.FC<ImageOutputProps> = ({ handleId, label, value, type }) => {
  const theme = useMantineTheme();

  return (
    <Flex style={{position: 'relative'}} my='auto' align='center' justify='space-between' w='100%'>
      <Group pr="0.25rem" gap="0.2rem" w='100%' align='center'>
        
        <TextInput
          size="xs"
          disabled={true}
          value={value?.short_display || ''}
          readOnly
          style={{ flex: 1 }}
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