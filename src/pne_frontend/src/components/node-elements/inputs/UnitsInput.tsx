import { Select } from "@mantine/core";
import { useContext } from "react";
import { FieldIndexContext } from "../CustomNode";
import { InputDisplayProps } from "../InputFieldDisplay";
import { setFieldData } from "../nodeUtils";
import { FieldData } from "../../../types/BaseDataTypes";

export function UnitsInput({ field, setField, expanded }: InputDisplayProps) {

    const fieldIndex = useContext(FieldIndexContext);
    
    
    return <Select
      w='100%'
      size='xs'
      disabled={field.disabled}
      classNames={{ input: 'nodrag nopan' }}
      value={field.data?.payload === null ? '' : field.data?.payload as string}
      data={['mm', 'in']}
      onChange={(e) => setFieldData(fieldIndex, setField, field, {...field.data, payload: e.target.value} as FieldData)}
    />
  }