import { useContext } from "react";
import type { InputNodeField } from "../../types/BaseDataTypes";
import { Flex, Text, Tooltip, Badge, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import ImageInput from './inputs/ImageInput';

import { NumberInput } from "./inputs/NumberInput";
import { TextInput } from "./inputs/TextInput";
import { FieldIndexContext, FieldDisplayContext } from "./CustomNode";


import {  } from "./CustomNode";
import { UnitsInput } from "./inputs/UnitsInput";

export interface InputFieldDisplayProps {
  field: InputNodeField;
  setField: (fieldIndex: number, field: InputNodeField) => void;
}

export interface InputDisplayProps {
  field: InputNodeField;
  setField: (fieldIndex: number, field: InputNodeField) => void;
  expanded: boolean;
}

function InputFieldDisplay({ field, setField }: InputFieldDisplayProps) {
  const fieldIndex = useContext(FieldIndexContext);
  const fieldDisplay = useContext(FieldDisplayContext);

  const expanded = fieldDisplay === 'node' ? field.node_expanded : field.inspector_expanded;
  const setExpanded = fieldDisplay === 'node' 
    ? (expanded: boolean) => setField(fieldIndex, { ...field, node_expanded: expanded } as InputNodeField)
    : (expanded: boolean) => setField(fieldIndex, { ...field, inspector_expanded: expanded } as InputNodeField);

  const renderInput = () => {
    // console.log('field.dtype: ', field.data?.class_name);
    switch (field.dtype) {
      case 'number':
        return <NumberInput 
          field={field} 
          setField={setField}
          expanded={expanded}
        />
      case 'string':
        return <TextInput 
          field={field} 
          setField={setField}
          expanded={expanded}
        />
      case 'units':
        return <UnitsInput 
          field={field} 
          setField={setField}
          expanded={expanded}
        />
      case 'image':
        return <ImageInput 
          field={field} 
          setField={setField}
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
      <Text px='0.25rem' size='sm' style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>{field.user_label ? field.user_label : field.label}</Text>
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
