import { ReactNode } from "react";
import { IntData, FloatData } from "../types/dataTypes/numberData";
import { AnyData } from "../types/dataTypes/anyData";
import NumberInput from "./leaf-inputs/NumberInput";
import ImageInput from "./leaf-inputs/ImageInput";
import { InputField, OutputField } from "../types/nodeTypes";
import ModelDataDisplay from "./ModelDataDisplay";
import ListDataDisplay from "./ListDataDisplay";
import { ImageData } from "../types/dataTypes/imageData";

// Recursive render function
const renderData = (
  data: AnyData,
  path: (string | number)[],
  field: InputField | OutputField,
  // index: number,
  // updateField: (newField: InputField, index: number) => void
): JSX.Element => {
  // Type guard: Check if we're dealing with an input or output path
  const isInputPath = path.includes('inputs');

  // Determine the type to render
  let inputType: string = "Unknown";
  
  if (data != null && "class_name" in data) {
    // If data exists, use its class_name
    inputType = data.class_name;
  } else if (isInputPath && 'default_generator_type' in field) {
    // If no data but has default_generator_type and is an input
    inputType = field.default_generator_type;
  }

  // Render based on the determined type
  switch (inputType) {
    case "ImageData":
      return (
        <div className="list-item">
          <ImageInput 
            path={path} 
            data={data as ImageData}
          />
        </div>
      );
    case "IntData":
      return (
        <div className="list-item">
          <NumberInput 
            data={(data && data.class_name === "IntData") ? data as IntData : { class_name: "IntData", id: "", payload: 0, metadata: {} } as IntData} 
            path={path} 
          />
        </div>
      );
    case "FloatData":
      return (
        <div className="list-item">
          <NumberInput 
            data={(data && data.class_name === "FloatData") ? data as FloatData : { class_name: "FloatData", id: "", payload: 0.0, metadata: {} } as FloatData} 
            path={path} 
          />
        </div>
      );
    case "ListData":
      return (
        <ListDataDisplay
          data={data}
          path={path}
          renderData={(d, p) => renderData(d, p, field)}
        />
      );
    default:
      // Check if it's a ModelData type
      if (data != null && "class_parent" in data && data.class_parent === "ModelData") {
        return (
          <ModelDataDisplay
            data={data}
            path={path}
            renderData={(d, p) => renderData(d, p, field)}
          />
        );
      }
      
      
      // No compatible input
      return <div>No Compatible Input</div>;
  }
};

interface RichDisplayProps {
  path: (string | number)[];
  field: InputField | OutputField;
  
}

export default function RichDisplay({ path, field }: RichDisplayProps): ReactNode {
  return (
    <div className="pne-div">
      {renderData(field.data || {} as AnyData, path, field)}
    </div>
  );
}

