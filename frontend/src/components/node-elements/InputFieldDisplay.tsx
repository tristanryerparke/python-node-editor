import type { NodeField } from "../../types/DataTypes";
import { Flex, Text, Tooltip, Badge, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import ImageInput from './inputs/ImageUploader';

import { TextInput, NumberInput } from "./inputs/BasicInputs";

export interface InputFieldDisplayProps {
  field: NodeField;
  onChange: (field: NodeField, data?: unknown, metadata?: Record<string, unknown>) => void;
  disabled: boolean
  expanded: boolean
  setExpanded: (expanded: boolean) => void
}

function InputFieldDisplay({ field, onChange, expanded, setExpanded, disabled }: InputFieldDisplayProps) {
  
  const renderInput = () => {
    switch (field.dtype) {
      case 'number':
        return <NumberInput 
          field={field} 
          onChange={onChange} 
          disabled={disabled}
          expanded={expanded} 
        />
      case 'string':
        return <TextInput 
          field={field} 
          onChange={onChange} 
          disabled={disabled}
          expanded={expanded} 
        />
      case 'image':
        return <ImageInput 
          field={field} 
          onChange={onChange} 
          disabled={disabled}
          expanded={expanded} 
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
      onClick={() => setExpanded(!expanded)}
      size='sm'
    >
    {expanded ? <IconChevronDown /> : <IconChevronUp />}
    </ActionIcon>
  }

  return (
    !expanded ? (
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
