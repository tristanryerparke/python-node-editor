import { 
  Flex, 
  Slider, 
  Radio,
  Group,
  Text,
  NumberInput as MantineNumberInput, 
} from "@mantine/core";
import type { InputDisplayProps } from "../InputFieldDisplay";
import { useState, useEffect, useContext } from "react";
import { FieldData } from "../../../types/BaseDataTypes";
import { FieldIndexContext } from "../CustomNode";
import { setFieldData, setFieldMetadata } from "../nodeUtils";

function NumberInputWrapper({ 
  value, 
  onChange, 
  ...props 
}: { 
  value: number, 
  onChange: (value: number) => void 
} & React.ComponentProps<typeof MantineNumberInput>) {
  // Wrapper component to handle empty values, setting on blur, etc
  const [tempValue, setTempValue] = useState<string | number>(value);

  // Update temp value when prop value changes
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleChange = (val: string | number) => {
    setTempValue(val);
  };

  const handleBlur = () => {
    // If empty or invalid, reset to 0
    if (tempValue === '' || isNaN(Number(tempValue))) {
      setTempValue(0);
      onChange(0);
    } else {
      // Update with the final number value
      onChange(Number(tempValue));
    }
  };

  const roundToThreeDecimals = (num: number) => {
    return Math.round(num * 1000) / 1000;
  };

  return (
    <MantineNumberInput
      {...props}
      value={typeof tempValue === 'number' ? roundToThreeDecimals(tempValue) : tempValue}
      onChange={handleChange}
      onBlur={handleBlur}
      allowDecimal
      allowNegative
    />
  );
}

export function NumberInput({ field, setField, expanded }: InputDisplayProps) {
  const fieldIndex = useContext(FieldIndexContext);
  
  // Initialize default values without setting them immediately
  const displayFormat = field.metadata?.display_format ?? 'input';
  const min = field.metadata?.min ?? -10;
  const max = field.metadata?.max ?? 10;
  const value = field.data?.payload ?? 0;
  
  // Only initialize metadata once when component mounts and setField is available
  useEffect(() => {
    if (!field.metadata && setField) {
      // Batch the metadata updates
      const initialMetadata = {
        ...field.metadata,
        min: -10,
        max: 10,
        display_format: 'input'
      };
      
      setField(fieldIndex, {
        ...field,
        metadata: initialMetadata
      });
    }
  }, [field, fieldIndex, setField]);

  // Guard against undefined setField
  if (!setField) return null;

  const handleValueChange = (newValue: number) => {
    setFieldData(fieldIndex, setField, field, {...field.data, payload: newValue} as FieldData);
  };

  const handleMinChange = (newMin: number) => {
    setFieldMetadata(fieldIndex, setField, field, 'min', newMin);
  };

  const handleMaxChange = (newMax: number) => {
    setFieldMetadata(fieldIndex, setField, field, 'max', newMax);
  };

  const handleDisplayFormatChange = (newFormat: string) => {
    setFieldMetadata(fieldIndex, setField, field, 'display_format', newFormat);
  };

  if (!expanded) {
    if (displayFormat === 'slider') {
      return <Flex w='100%' justify='center' align='center' gap='0.5rem'>
        <Slider
          classNames={{ track: 'nodrag' }}
          w='100%'
          value={value}
          onChange={(e) => handleValueChange(e)}
          min={min}
          max={max}
          disabled={field.disabled}
        />
        <Text size='xs'>{value}</Text>
      </Flex>
    }
    return (
      <NumberInputWrapper
        w='100%'
        value={value}
        onChange={(e) => handleValueChange(e)}
        min={min}
        max={max}
        size='xs'
        disabled={field.disabled || field.is_edge_connected}
      />
    );
  }
  
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
      <NumberInputWrapper
        label='min'
        value={min}
        onChange={handleMinChange}
        size='xs'
        w='100%'
        disabled={field.disabled || field.is_edge_connected}
      />
      <NumberInputWrapper
        label='max'
        value={max}
        onChange={handleMaxChange}
        size='xs'
        w='100%'
        disabled={field.disabled || field.is_edge_connected}
      />
      <NumberInputWrapper
        label='value'
        value={value}
        onChange={handleValueChange}
        min={min}
        max={max}
        size='xs'
        w='100%'
        disabled={field.disabled || field.is_edge_connected}
      />
    </Flex>
    <Flex w='100%' justify='center' align='center' gap='1rem' direction='row'>
      <Text size='xs'>Format: </Text>
      <Radio.Group
        value={displayFormat}
        onChange={handleDisplayFormatChange}
      >
        <Group gap='0.25rem'>
          <Radio p={0} size="xs" value="input" label="Input" />
          <Radio p={0} size="xs" value="slider" label="Slider" />
        </Group>
      </Radio.Group>
    </Flex>
  </Flex>
}
