import { ReactNode } from "react";
import { IntData, FloatData } from "../types/dataTypes/numberData";
import { AnyData } from "../types/dataTypes/anyData";
import NumberDisplay from "./leaf-data-displays/NumberDisplay";
import ImageInput from "./leaf-data-displays/ImageDisplay";
import { InputField, OutputField } from "../types/nodeTypes";
import ModelDataDisplay from "./structured_data/ModelDataDisplay";
import ListDataDisplay from "./structured_data/ListDataDisplay";
import { ImageData } from "../types/dataTypes/imageData";

import '../components/customNode/node_styles.css';
import '../common/structured_data/structured_data_styles.css';

// Recursive render function
const renderData = (
  data: AnyData,
  path: (string | number)[],
  field: InputField | OutputField,
  // index: number,
  // updateField: (newField: InputField, index: number) => void
): JSX.Element => {
  // Type guard: Check if we're dealing with an input or output path
  // const isInputPath = path.includes('inputs');

  // Determine the type to render
  let inputType: string = "Unknown";
  
  if (data != null && "class_name" in data) {
    // If data exists, use its class_name
    inputType = data.class_name;
  } else if ('allowed_types' in field) {
    // If no data but has allowed_types (for both input and output fields)
    inputType = field.allowed_types[0];
  } 

  // Render based on the determined type
  switch (inputType) {
    case "ImageData":
      return (
        <div className="data-wrapper">
          <ImageInput 
            path={path} 
            data={data as ImageData | null}
          />
        </div>
      );
    case "IntData":
      return (
        <div className="data-wrapper">
          <NumberDisplay 
            data={(data && data.class_name === "IntData") ? data as IntData : { class_name: "IntData", id: "", payload: 0, metadata: {} } as IntData} 
            path={path} 
          />
        </div>
      );
    case "FloatData":
      return (
        <div className="data-wrapper">
          <NumberDisplay 
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
      return <div className="data-wrapper">No Compatible Display</div>;
  }
};

interface RichDisplayProps {
  path: (string | number)[];
  field: InputField | OutputField;
  
}

export default function RichDisplay({ path, field }: RichDisplayProps): ReactNode {
  // return (
  //   <div className="pne-div" style={{
  //     width: '100%',
  //     flexGrow: 1,
  //     display: 'flex',
  //     flexDirection: 'row',
  //     alignItems: 'center',
  //     gap: '5px'
  //   }}>
  //     {renderData(field.data || {} as AnyData, path, field)}
  //   </div>
  // );
  return renderData(field.data || {} as AnyData, path, field);
}

