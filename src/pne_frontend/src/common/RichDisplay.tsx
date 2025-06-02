import { ReactNode, ReactElement } from "react";
import { IntData, FloatData } from "../types/dataTypes/numberData";
import { AnyData } from "../types/dataTypes/anyData";
import NumberDisplay from "./leaf-data-displays/NumberDisplay";
import ImageDisplay from "./leaf-data-displays/ImageDisplays/ImageDisplay";
import { InputField, OutputField } from "../types/nodeTypes";
import ModelDataDisplay from "./structured_data/ModelDataDisplay";
import ListDataDisplay from "./structured_data/ListDataDisplay";
import { ImageData } from "../types/dataTypes/imageData";
import StringDisplay from "./leaf-data-displays/StringDisplay";
import { StringData } from "../types/dataTypes/stringData";
import SVGDisplay from "./leaf-data-displays/ImageDisplays/SVGDisplay";
import SingleLineTextDisplay from "./leaf-data-displays/SingleLineTextDisplay";

// Recursive render function
const renderData = (
  data: AnyData,
  path: (string | number)[],
  field: InputField | OutputField,
  // index: number,
  // updateField: (newField: InputField, index: number) => void
): ReactElement => {
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
          <ImageDisplay 
            path={path} 
            data={data as ImageData | null}
          />
      );
    case "SVGData":
      return (
        <SVGDisplay data={data as StringData | null} path={path} />
      );
    case "IntData":
    case "FloatData":
      return (
        <NumberDisplay 
          data={data as IntData | FloatData | null} 
          path={path} 
        />
      );
    case "StringData":
      return (
        <StringDisplay 
          data={data as StringData | null} 
          path={path} 
        />
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

      if (data == null || data == undefined || isEmptyObject(data)) {
        return <SingleLineTextDisplay content='No Data'/>;
      } else {
        // No compatible input
        console.log("No compatible display for data:", data);
        return <SingleLineTextDisplay content='No compatible display'/>;
      }
  }
};

function isEmptyObject(obj: unknown): boolean {
  return obj != null && typeof obj === "object" && Object.keys(obj).length === 0;
}

interface RichDisplayProps {
  path: (string | number)[];
  field: InputField | OutputField;
  
}

export default function RichDisplay({ path, field }: RichDisplayProps): ReactNode {
  return renderData(field.data || {} as AnyData, path, field);
}
