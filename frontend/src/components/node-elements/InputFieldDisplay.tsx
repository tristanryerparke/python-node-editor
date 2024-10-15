import type { NodeField } from "../../types/DataTypes";
import { Flex, Text, Tooltip, Badge, ActionIcon } from '@mantine/core';
import { useState } from 'react';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import ImageInput from './inputs/ImageUploader';

import { TextInput, NumberInput } from "./inputs/BasicInputs";

export interface InputFieldDisplayProps {
  field: NodeField;
  onChange: (field: NodeField, data: unknown, metadata?: Record<string, unknown>) => void;
  expanded: boolean
  disabled: boolean
}

function InputFieldDisplay({ field, onChange, expanded, disabled }: InputFieldDisplayProps) {
  const [expandedState, setExpandedState] = useState(expanded);
  
  const renderInput = () => {
    switch (field.dtype) {
      case 'number':
        return <NumberInput 
          field={field} 
          onChange={onChange} 
          expanded={expandedState} 
          disabled={disabled}
        />
      case 'string':
        return <TextInput 
          field={field} 
          onChange={onChange} 
          expanded={expandedState} 
          disabled={disabled}
        />
      case 'image':
        return <ImageInput 
          field={field} 
          onChange={onChange} 
          expanded={expandedState} 
          disabled={disabled}
        />
      // Add more cases for future data types here
      default:
        return null;
    } 
  };

  const renderLabel = () => {
    return <Tooltip 
      withArrow 
      label={
        <Badge size='md'>{field.dtype}</Badge>
      }
      color='dark.4'
      position='left'
    >
      <Text px='0.25rem' size='sm' style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>{field.user_label}</Text>
    </Tooltip>
  }

  const renderExpandButton = () => {
    return <ActionIcon 
      variant='subtle' 
      color='dark.3' 
      onClick={() => setExpandedState(!expandedState)}
      size='sm'
    >
    {expandedState ? <IconChevronDown /> : <IconChevronUp />}
    </ActionIcon>
  }

  return (
    !expandedState ? (
      <Flex direction='row' h='30px' w='100%' gap='0.25rem' align='center' justify='space-between'>
        {renderLabel()}
        {renderInput()}
        {renderExpandButton()}
      </Flex>
    ) : (
      <Flex direction='column' w='100%'>
        <Flex direction='row' h='30px' align='center' w='100%' justify='space-between'>
          {renderLabel()}
          {renderExpandButton()}
        </Flex>
        {renderInput()}
      </Flex>
    )
  );
}

export default InputFieldDisplay;