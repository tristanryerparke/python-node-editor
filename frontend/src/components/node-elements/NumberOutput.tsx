import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { TextInput, Group, Text, Flex, useMantineTheme, Tooltip } from '@mantine/core';

interface NumberOutputProps {
  handleId: string;
  label: string;
  value: number;
  type: string;
}

const NumberOutput: React.FC<NumberOutputProps> = ({ handleId, label, value, type }) => {
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
            backgroundColor: theme.colors.teal[5],
            position: 'absolute',
            top: '0.375rem',
            transform: 'translateX(1rem)'
          }}
        />
      </Tooltip>
    </Flex>
  );
};

export default NumberOutput;