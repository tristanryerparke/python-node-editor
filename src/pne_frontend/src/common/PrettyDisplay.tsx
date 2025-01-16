import { ReactNode } from "react";
import { ModelData } from "../types/dataTypes";
import { BaseData } from "../types/dataTypes";
import { isBasicData } from "../utils/dataUtils";

import NumberInput from "./inputs/NumberInput";
import { AnyData } from "../types/dataTypes/anyData";
import { useField } from '../contexts/FieldContext';

function Render(
  data: BaseData | ModelData | ImageData,
  updateData: (data: BaseData | ModelData | ImageData) => void,
  currentKey?: string
): ReactNode {
  const keyDisplay = currentKey ? `${currentKey}: ` : '';
  if (data == null) {
    return `${keyDisplay}no data\n`;
  } else if (isBasicData(data)) {
    if (data.class_name === 'FloatData' || data.class_name === 'IntData') {
      return <NumberInput/>
    }
  } else {
    return `${keyDisplay}unknown data type\n`;
  }
}

export default function PrettyDisplay(): ReactNode {
  const { field, updateField, index } = useField();

  // console.log('PrettyDisplay Props:', { field, updateField, index });

  if (!field) {
    console.error('PrettyDisplay: field is undefined', { field });
    return <div className="pne-div">Error: Field is undefined.</div>;
  }

  if (!field.data) {
    console.error('PrettyDisplay: field.data is undefined', { field });
    return <div className="pne-div">Error: Field data is undefined.</div>;
  }

  const updateData = (newData: AnyData) => {
    updateField({
      ...field,
      data: newData
    }, index);
  }

  return <div className="pne-div"> 
    pretty:
    {Render(field.data, updateData)}
  </div>
}