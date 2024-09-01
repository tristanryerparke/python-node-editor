import { useRef, useEffect } from 'react';
import { NodeField } from '../../types/DataTypes';
import { NumberInput, TextInput, Flex, Tooltip, Text } from '@mantine/core';
import { Handle, Position, useEdges } from '@xyflow/react';
import { useMantineTheme } from '@mantine/core';
import ImageInput from './ImageUploader';

export interface InputFieldProps {
  nodeId: string;
  inputField: NodeField;
  onChange: (label: string, value: any) => void;
}

export default function InputField({ nodeId, inputField, onChange }: InputFieldProps) {
  const theme = useMantineTheme();

  const handleId = `${nodeId}-input-${inputField.label}`

  // watch for connected edges
  const edges = useEdges()
  const inputEdge = edges.find(edge => edge.target === nodeId && edge.targetHandle === handleId)
  const isEdgeConnected = !!inputEdge
  const prevIsEdgeConnectedRef = useRef(isEdgeConnected);
  useEffect(() => {
    if (isEdgeConnected && !prevIsEdgeConnectedRef.current) {
      onChange(inputField.id, { data: '' });
    } else if (!isEdgeConnected && prevIsEdgeConnectedRef.current) {
      onChange(inputField.id, { data: '' });
    }
    prevIsEdgeConnectedRef.current = isEdgeConnected;
  }, [inputField.id, isEdgeConnected, onChange]);


  const renderInput = () => {
    switch (inputField.dtype) {
      case 'number':
        return <NumberInput
          w='100%'
          value={inputField.data}
          disabled={isEdgeConnected}
          onChange={(value) => onChange(inputField.id, { data: value })}
        />;

      case 'string':
        return <TextInput
          w='100%'
          value={inputField.data}
          disabled={isEdgeConnected}
          onChange={(e) => onChange(inputField.id, { data: e.currentTarget.value })}
        />;

      case 'image':
        return <ImageInput
          inputField={inputField}
          isEdgeConnected={isEdgeConnected}
          onChange={(id, value) => onChange(id, value)}
        />

      default:
        return null;
    }
  };

  return (
    <Flex style={{position: 'relative'}} px='0.5rem' my='auto' align='center' justify='space-between' w='100%'>
      <Tooltip offset={15} floatingStrategy='fixed' label={inputField.dtype} color='dark.3' position='left' withArrow arrowSize={8}>
        <Flex style={{flexGrow: 0}}>
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

        <Text px="0.5rem">{inputField.label}</Text>
        </Flex>
      </Tooltip>
      {renderInput()}
    </Flex>
  )
}

