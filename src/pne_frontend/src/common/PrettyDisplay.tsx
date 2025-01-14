import { ReactNode } from "react";
import { ModelData } from "../types/dataTypes";
import { BaseData } from "../types/dataTypes";
import { isBasicData, isListData, isModelData, isImageData, isNumpyData } from "../utils/dataUtils";

import { NumberInput } from "@mantine/core";
import { InputField } from "../types/nodeTypes";

function Render(
  data: BaseData | ModelData | ImageData,
  updateValue: (value: number) => void,
  currentKey?: string
): ReactNode {
  const keyDisplay = currentKey ? `${currentKey}: ` : '';
  if (data == null) {
    return `${keyDisplay}no data\n`;
  } else if (isBasicData(data)) {
    if (data.class_name === 'FloatData' || data.class_name === 'IntData') {
      return <NumberInput 
        value={data.payload} 
        onChange={(value) => updateValue(value)} />
    }
  } else {
    return `${keyDisplay}unknown data type\n`;
  }
}

interface PrettyDisplayProps {
  field: InputField;
  updateField: (field: InputField, index: number) => void;
  index: number;
}

export default function PrettyDisplay({
  field,
  updateField,
  index
}: PrettyDisplayProps): ReactNode {

  console.log('PrettyDisplay Props:', { field, updateField, index });

  if (!field) {
    console.error('PrettyDisplay: field is undefined', { field });
    return <div className="pne-div">Error: Field is undefined.</div>;
  }

  if (!field.data) {
    console.error('PrettyDisplay: field.data is undefined', { field });
    return <div className="pne-div">Error: Field data is undefined.</div>;
  }

  const updateValue = (value: number) => {
    updateField({
      ...field,
      data: {
        ...field.data,
        payload: value
      }
    }, index);
  }

  return <div className="pne-div"> 
    pretty:
    {Render(field.data, updateValue)}
  </div>
}