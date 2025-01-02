import { Flex, Text, Tooltip, ActionIcon, NumberInput } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { BaseData } from '../../types/BaseDataTypes';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useState, useContext } from 'react';
import { FieldIndexContext } from './CustomNode';

import { IntDataSchema, StringDataSchema, FloatDataSchema, BoolDataSchema } from './DataTypes';

export interface InputField {
  data: BaseData | null;
  allowed_types: string[];
  default_generator_type: string;
  display_type: string;
  label: string;
  description: string;
  user_label: string;
  is_edge_connected: boolean;
  metadata: Record<string, unknown>;
}

export interface InputFieldCreateProps {
  field: InputField;
  setField: (fieldIndex: number, field: InputField) => void;
}

function CreateDataObject(class_name: string, payload: unknown): BaseData {
  const rawData = {
    class_name,
    payload,
    id: uuidv4()
  };

  switch (class_name) {
    case 'IntData':
      return IntDataSchema.parse(rawData);
    case 'StringData':
      return StringDataSchema.parse(rawData);
    case 'FloatData':
      return FloatDataSchema.parse(rawData);
    case 'BoolData':
      return BoolDataSchema.parse(rawData);
    default:
      throw new Error(`Unsupported class_name: ${class_name}`);
  }
}

function IntInput({ field, setField }: InputFieldCreateProps) {
  const fieldIndex = useContext(FieldIndexContext);
  const [value, setValue] = useState<number | undefined>(field.data?.payload as number);
  const [debouncedValue] = useDebouncedValue(value, 200);

  useEffect(() => {
    if (debouncedValue !== undefined && debouncedValue !== field.data?.payload) {
      const newField = { ...field } as InputField;
      newField.data = { ...field.data, payload: debouncedValue };
      setField(fieldIndex, newField);
    }
  }, [debouncedValue]);

  return <NumberInput 
    value={value}
    classNames={{ input: 'nodrag nopan' }}
    onChange={(val) => {
      setValue(typeof val === 'string' ? (val === '' ? undefined : parseInt(val)) : val);
    }}
    step={1}
  />;
}



function InputFieldDisplay({ field, setField }: InputFieldCreateProps) {
  const [expanded, setExpanded] = useState(false);
  const fieldIndex = useContext(FieldIndexContext);

  const renderInput = () => {
    if (field.default_generator_type !== null) {
      switch (field.default_generator_type) {
        case 'IntData':
          return <IntInput field={field} setField={setField} />
        case 'FloatData':
          return <div>String</div>
        case 'StringData':
          return <div>Units</div>
      }
    }
  }

  const renderLabel = () => {
    return <Tooltip 
      withArrow 
      label={
        <div style={{flexDirection: 'column', gap: '0.25rem' }}>
          <b>Allowed Types:</b> 
          {field.allowed_types.join(', ')}
        </div>
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
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        height: '30px',
        width: '100%',
        gap: '0.25rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        
      }}>
        {renderLabel()}
        {renderInput()}
        {renderExpandButton()}
      </div>
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
