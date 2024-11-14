import { useContext } from "react";
import { Flex, ActionIcon, Tooltip, Badge, Text } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { OutputNodeField } from "../../types/DataTypes";
import { TextOutput } from "./outputs/TextOutput";
import { NumberOutput } from "./outputs/NumberOutput";
import  ImageOutput from "./outputs/ImageOutput";
import { PolylineOutput } from "./outputs/GeometryOutputs";
import { FieldIndexContext, FieldDisplayContext } from "./CustomNode";



export interface OutputFieldDisplayProps {
  field: OutputNodeField;
  setField: (fieldIndex: number, field: OutputNodeField) => void;
}

export interface OutputDisplayProps {
  field: OutputNodeField;
  expanded: boolean;
}

function OutputFieldDisplay({ field, setField }: OutputFieldDisplayProps) {
  const fieldIndex = useContext(FieldIndexContext);
  const fieldDisplay = useContext(FieldDisplayContext);

  const expanded = fieldDisplay === 'node' ? field.node_expanded : field.inspector_expanded;
  const setExpanded = fieldDisplay === 'node' 
    ? (expanded: boolean) => setField(fieldIndex, { ...field, node_expanded: expanded } as OutputNodeField)
    : (expanded: boolean) => setField(fieldIndex, { ...field, inspector_expanded: expanded } as OutputNodeField);

  const renderLabel = () => {
    return <Flex>
      <Tooltip 
        withArrow 
        label={
          <Badge size='md'>{field.dtype}</Badge>
        }
        color='dark.4'
        position='right'
      >
        <Text px='0.25rem' size='sm' style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>{field.user_label ? field.user_label : field.label}</Text>
      </Tooltip>
      </Flex>
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



  const renderOutput = () => {
    switch (field.dtype) {
      // case 'basemodel':
      //   return <PolylineOutput field={field} setField={setField} />
      case 'string':
        return <TextOutput field={field} expanded={expanded} />
      case 'number':
        return <NumberOutput field={field} expanded={expanded} />
      case 'image':
        return <ImageOutput field={field} expanded={expanded} />
      default:
        return <TextOutput field={field} expanded={expanded} />
    }
  }

  return (
    !expanded ? (
      <Flex direction='row' h='30px' w='100%' gap='0.25rem' align='center' justify='space-between'>
        {renderExpandButton()}
        <Flex style={{ flex: 1, overflowX: 'hidden' }}>
          {renderOutput()}
        </Flex>
        {renderLabel()}
      </Flex>
    ) : (
      <Flex direction='column' w='100%'>
        <Flex direction='row' h='30px' align='center' w='100%' justify='space-between'>
          {renderExpandButton()}
          {renderLabel()}
        </Flex>
        <Flex style={{ flex: 1, width: '100%', overflowX: 'hidden' }}>
          {renderOutput()}
        </Flex>
      </Flex>
    )
  );
}

export default OutputFieldDisplay;
