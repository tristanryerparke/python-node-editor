import { Flex, ActionIcon, Tooltip, Badge, Text } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { NodeField } from "../../types/DataTypes";
import { FieldDisplayHeader } from "./FieldDisplayHeader";
import { useState } from "react";
import { TextOutput, NumberOutput } from "./outputs/BasicOutputs";

export interface OutputFieldDisplayProps {
  field: NodeField;
  expanded: boolean;
}

function OutputFieldDisplay({ field, expanded }: OutputFieldDisplayProps) {
  const [expandedState, setExpandedState] = useState(expanded);

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

  const renderLabel = () => {
    return <Tooltip 
      withArrow 
      label={
        <Badge size='md'>{field.dtype}</Badge>
      }
      color='dark.4'
      position='right'
    >
      <Text px='0.25rem' size='sm' style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>{field.user_label}</Text>
    </Tooltip>
  }

  const renderOutput = () => {
    switch (field.dtype) {
      case 'string':
        return <TextOutput field={field} expanded={expanded} />
      case 'number':
        return <NumberOutput field={field} expanded={expanded} />
      default:
        return <TextOutput field={field} expanded={expanded} />
    }
  }

  return (
    !expandedState ? (
      <Flex direction='row' h='30px' w='100%' gap='0.25rem' align='center' justify='space-between'>
        {renderExpandButton()}
        {renderOutput()}
        {renderLabel()}
        
      </Flex>
    ) : (
      <Flex direction='column' w='100%' >
        <Flex direction='row' h='30px' align='center' w='100%' justify='space-between'>
          {renderExpandButton()}
          {renderLabel()}
        </Flex>
        {renderOutput()}
      </Flex>
    )
  );
}

export default OutputFieldDisplay;