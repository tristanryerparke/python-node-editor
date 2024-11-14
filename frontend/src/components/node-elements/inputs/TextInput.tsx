import { TextInput as MantineTextInput, Textarea } from "@mantine/core";
import { useContext } from "react";
import { FieldIndexContext } from "../CustomNode";
import { InputDisplayProps } from "../InputFieldDisplay";
import { setFieldData } from "../nodeUtils";
import { FieldData } from "../../../types/DataTypes";

export function TextInput({ field, setField, expanded }: InputDisplayProps) {

    const fieldIndex = useContext(FieldIndexContext);
    
    if (!expanded) {
      return <MantineTextInput
        w='100%'
        size='xs'
        disabled={field.disabled}
        classNames={{ input: 'nodrag nopan' }}
        value={field.data?.payload === null ? '' : field.data?.payload}
        onChange={(e) => setFieldData(fieldIndex, setField, field, {...field.data, payload: e.target.value} as FieldData)}
      />
    }
  
    // The large text input is a textarea
    return <Textarea
      className={'nodrag'}
      autosize
      minRows={1}
      disabled={field.disabled}
      w='100%'
      value={field.data?.payload === null ? '' : field.data?.payload}
      onChange={(e) => setFieldData(fieldIndex, setField, field, {...field.data, payload: e.target.value} as FieldData)}
      styles={{
        input: {
          fontSize: '12px',
        }
      }}
    />
  }