import { NodeField } from '../../types/DataTypes';
import { TextInput, Flex, Tooltip, Text } from '@mantine/core';
import { Handle, Position } from '@xyflow/react';
import { useMantineTheme } from '@mantine/core';

export interface OutputFieldProps {
  nodeId: string;
  outputField: NodeField;
}
  
export default function OutputField({ nodeId, outputField }: OutputFieldProps) {
  const handleId = `${nodeId}-output-${outputField.label}`
  const theme = useMantineTheme();

  const renderOutput = () => {
    switch (outputField.dtype) {
      case 'number':
      case 'string':
        return <TextInput
          className='input-as-text-display'
          disabled
          w='100%'
          value={outputField.data ?? ''}
        />;
      case 'image':
        return <TextInput
          className='input-as-text-display'
          disabled
          w='100%'
          value={outputField.description ?? ''}
        />;
      default:
        return null;
    }
  };

  return (
    <Flex style={{position: 'relative'}} px='0.5rem' my='auto' align='center' justify='space-between' w='100%'>
      {renderOutput()}
      
      <Tooltip offset={15} floatingStrategy='fixed' label={outputField.dtype} color='dark.3' position='right' withArrow arrowSize={8}>
        <Flex>
          <Text px="0.5rem">{outputField.label}</Text>
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