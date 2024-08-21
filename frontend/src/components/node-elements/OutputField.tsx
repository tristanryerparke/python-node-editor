import { NodeOutput } from '../../types/DataTypes';
import { NumberInput, TextInput, Flex, Group, Tooltip, Text } from '@mantine/core';
import { Handle, Position, useEdges } from '@xyflow/react';
import { useMantineTheme } from '@mantine/core';

export interface OutputFieldProps {
  nodeId: string;
  output: NodeOutput;
  onChange: (label: string, value: any) => void;
}

export default function OutputField({ nodeId, output, onChange }: OutputFieldProps) {

  const handleId = `${nodeId}-output-${output.label}`

  const theme = useMantineTheme();

  const renderOutput = () => {
    switch (output.type) {
      case 'number':
      case 'string':
        return <TextInput
          disabled
          w='100%'
          value={output.value ?? ''}
        />;
      case 'image':
        return <TextInput
          disabled
          w='100%'
          value={output.value?.short_display ?? output.value ?? ''}
        />;
      default:
        return null;
    }
  };

  return (
    <Flex style={{position: 'relative'}} px='0.5rem' my='auto' align='center' justify='space-between' w='100%'>
      {renderOutput()}
      
      <Tooltip offset={15} floatingStrategy='fixed' label={output.type} color='dark.3' position='right' withArrow arrowSize={8}>
        <Flex>
          <Text px="0.5rem">{output.label}</Text>
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
              }}
              />
        
        </Flex>
      </Tooltip>
    </Flex>
  )
}