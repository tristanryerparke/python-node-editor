import { useRef, useEffect } from 'react';
import { NodeInput } from '../../types/DataTypes';
import { NumberInput, TextInput, Flex, Tooltip, Text, ActionIcon, Button } from '@mantine/core';
import { Handle, Position, useEdges } from '@xyflow/react';
import { useMantineTheme } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { ImageData } from '../../types/DataTypes';
import ImageInput from './ImageUploader';

export interface InputFieldProps {
  nodeId: string;
  input: NodeInput;
  onChange: (label: string, value: any) => void;
}

export default function InputField({ nodeId, input, onChange }: InputFieldProps) {
  const theme = useMantineTheme();

  const handleId = `${nodeId}-input-${input.label}`

  const edges = useEdges()
  const inputEdge = edges.find(edge => edge.target === nodeId && edge.targetHandle === handleId)
  const isEdgeConnected = !!inputEdge

  const prevIsEdgeConnectedRef = useRef(isEdgeConnected);

  useEffect(() => {
    if (isEdgeConnected && !prevIsEdgeConnectedRef.current) {
      // console.log('Rising edge: Connection established');
      onChange(input.label, null)
      // Handle rising edge event
    } else if (!isEdgeConnected && prevIsEdgeConnectedRef.current) {
      // console.log('Falling edge: Connection lost');
      onChange(input.label, null)
    }
    prevIsEdgeConnectedRef.current = isEdgeConnected;
  }, [input.label, isEdgeConnected, onChange]);


  const renderInput = () => {
    switch (input.type) {

      // Number input
      case 'number':
        return <NumberInput
          w='100%'
          value={input.input_data ?? ''}
          disabled={isEdgeConnected}
          onChange={(value) => onChange(input.label, value)}
        />;

      // Text input
      case 'string':
        return <TextInput
          w='100%'
          value={input.input_data ?? ''}
          disabled={isEdgeConnected}
          onChange={(e) => {onChange(input.label, e.currentTarget.value)}}
        />;

      case 'image':
        return <ImageInput
          input={input}
          disabled={isEdgeConnected}
          onChange={onChange}
        />

      default:
        return null;
    }
  };

  return (
    <Flex style={{position: 'relative'}} px='0.5rem' my='auto' align='center' justify='space-between' w='100%'>
      <Tooltip offset={15} floatingStrategy='fixed' label={input.type} color='dark.3' position='left' withArrow arrowSize={8}>
        <Flex>
        <Handle
            type="target"
            id={handleId}
            position={Position.Left}
            style={{ 
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              border: '2px solid',
              borderColor: theme.colors.dark[2],
              backgroundColor: theme.colors.dark[5],
            }}
          />

        <Text px="0.5rem">{input.label}</Text>
        </Flex>
      </Tooltip>
      
      {renderInput()}
    </Flex>
  )
}