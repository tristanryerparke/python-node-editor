import { 
  Flex, 
  Textarea, 
  Slider, 
  NumberInput as MantineNumberInput, 
  TextInput as MantineTextInput 
} from "@mantine/core";
import type { InputFieldDisplayProps } from "../InputFieldDisplay";
import { useState, useEffect } from "react";

export function TextInput({ field, onChange, expanded, disabled }: InputFieldDisplayProps) {
  if (!expanded) {
    return <MantineTextInput
      w='100%'
      size='xs'
      disabled={disabled}
      classNames={{ input: 'nodrag nopan' }}
      value={field.data}
      onChange={(e) => onChange(field, e.target.value)}
    />
  }

  // The large text input is a textarea
  return <Textarea
    className={'nodrag'}
    autosize
    minRows={3}
    disabled={disabled}
    w='100%'
    value={field.data}
    onChange={(e) => onChange(field, e.target.value)}
    styles={{
      input: {
        fontSize: '12px',
      }
    }}
  />
}

export function NumberInput({ field, onChange, expanded, disabled }: InputFieldDisplayProps) {
  const [min, setMin] = useState(field.metadata?.min as number || -10);
  const [max, setMax] = useState(field.metadata?.max as number || 10);
  const [value, setValue] = useState(field.data as number || 0);

  useEffect(() => {
    setMin(field.metadata?.min as number || -10);
    setMax(field.metadata?.max as number || 10);
  }, [field.metadata?.min, field.metadata?.max]);

  useEffect(() => {
    setValue(Number(field.data) || 0);
  }, [field.data]);

  const handleValueChange = (newValue: number) => {
    setValue(newValue);
    onChange(field, newValue as number);
  };

  const handleMinChange = (newMin: number) => {
    setMin(newMin);
    onChange(field, value as number, { min: newMin });
  };

  const handleMaxChange = (newMax: number) => {
    setMax(newMax);
    onChange(field, value as number, { max: newMax });
  };

  // The small number input is just a mantine number input
  if (!expanded) {
    return <MantineNumberInput
      w='100%'
      value={value}
      onChange={(e) => handleValueChange(Number(e))}
      min={min}
      max={max}
      size='xs'
      disabled={disabled}
    />
  }
  
  // The large number input is a slider and a set of number inputs for the min, max, and value
  return <Flex w='100%' direction='column' align='center' justify='center' gap='0.25rem' className='nodrag' pt='0.5rem'>
    <Slider
      w='100%'
      value={value}
      onChange={handleValueChange}
      min={min}
      max={max}
      pb='0.5rem'
    />
    <Flex w='100%' justify='space-between' gap='0.5rem'>
      <MantineNumberInput
        label='min'
        value={min}
        onChange={(e) => handleMinChange(Number(e))}
        size='xs'
        w='100%'
        disabled={disabled}
      />
      <MantineNumberInput
        label='max'
        value={max}
        onChange={(e) => handleMaxChange(Number(e))}
        size='xs'
        w='100%'
        disabled={disabled}
      />
      <MantineNumberInput
        label='value'
        value={value}
        onChange={(e) => handleValueChange(Number(e))}
        min={min}
        max={max}
        size='xs'
        w='100%'
        disabled={disabled}
      />
    </Flex>
  </Flex>
}
