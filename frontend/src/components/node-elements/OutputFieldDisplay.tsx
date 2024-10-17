import { Flex, ActionIcon, Tooltip, Badge, Text } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { NodeField } from "../../types/DataTypes";
import { TextOutput, NumberOutput } from "./outputs/BasicOutputs";
import ImageOutput from "./outputs/ImageOutput";

export interface OutputFieldDisplayProps {
  field: NodeField;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

function OutputFieldDisplay({ field, expanded, setExpanded }: OutputFieldDisplayProps) {
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
