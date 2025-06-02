import { type AnyData, type BasicData, isBasicData } from "../types/dataTypes/anyData";
import { isNumpyData } from "../types/dataTypes/numpyData";
import { isListData } from "../types/dataTypes/listData";
import { isModelData } from "../types/dataTypes/modelData";
import { isImageData } from "../types/dataTypes/imageData";
import { Resizable } from 're-resizable';
import { Move } from "lucide-react";

function Render(
  data: AnyData, 
  runningIndent: number = 0, 
  padObject: string = '   ', 
  currentKey?: string
): string {
  const indentStr = padObject.repeat(runningIndent);
  const keyDisplay = currentKey ? `${currentKey}: ` : '';

  if (data == null) {
    return `${indentStr}${keyDisplay}no data\n`;
  }

  if (typeof data !== 'object') {
    // Handle unexpected data types
    return `${indentStr}${keyDisplay}invalid data type ${typeof data}\n`;
  }

  if (isBasicData(data)) {
    const basicData = data as BasicData;
    return `${indentStr}${keyDisplay}${basicData.class_name}: ${basicData.payload}\n`;
  } else if (isListData(data)) {
    const lines: string[] = [];
    lines.push(`${indentStr}${keyDisplay}${data.class_name}[\n`);
    data.payload.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        lines.push(Render(item as AnyData, runningIndent + 1, padObject));
      } else {
        lines.push(`${indentStr}${padObject}invalid item type\n`);
      }
    });
    lines.push(`${indentStr}]\n`);
    return lines.join('');
  } else if (isModelData(data)) {
    const lines: string[] = [];
    lines.push(`${indentStr}${keyDisplay}${data.class_name}(\n`);
    Object.entries(data).forEach(([key, value]) => {
      // Skip rendering class_name and class_parent
      if (key !== 'class_name' && key !== 'class_parent' && typeof value === 'object' && value !== null) {
        lines.push(Render(value as AnyData, runningIndent + 1, padObject, key));
      } else if (key !== 'class_name' && key !== 'class_parent') {
        lines.push(`${indentStr}${padObject}${key}: ${value}\n`);
      }
    });
    lines.push(`${indentStr})\n`);
    return lines.join('');
  } else if (isImageData(data)) {
    const lines: string[] = [];
    lines.push(`${indentStr}${keyDisplay}${data.class_name}(\n`);
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'class_name') {
        lines.push(`${indentStr}${padObject}${key}: ${value}\n`);
      }
    });
    lines.push(`${indentStr})\n`);
    return lines.join('');
  } else if (isNumpyData(data)) {
    return `${indentStr}${keyDisplay}${data.class_name}: ${JSON.stringify(data.payload)}\n`;
  } else {
    // Default case to handle unexpected data types
    return `${indentStr}${keyDisplay}unknown data type\n`;
  }
}


const CustomHandle = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    style={{
      background: '#fff',
      height: '100%',
      width: '100%',
      padding: 0,
      transform: 'translate(-50%, -50%)',
    }}
    {...props}
  />
);

const BottomRightHandle = () => (
  <CustomHandle className='nodrag nopan nowheel'>
    <Move size={16} style={{
      transform: 'rotate(90deg)',
      opacity: 0.5,
    }}/>
  </CustomHandle>
);

export default function DebugDisplay({ data }: { data: unknown }) {
  return (
    <Resizable
      defaultSize={{
        width: 150,
        height: 150,
      }}
      className='nodrag nopan nowheel'
      minWidth={150}
      style={{
        border: '1px solid black',
        borderRadius: '0.25rem',
        overflow: 'auto',
        position: 'relative',
        display: 'flex',
        whiteSpace: 'pre',
        cursor: 'text',
        padding: '0.5rem',
      }}
      enable={{
        top: false,
        right: false,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: true,
        bottomLeft: false,
        topLeft: false,
      }}
      handleComponent={{
        bottomRight: <BottomRightHandle />,
      }}
    >
      {Render(data as AnyData)}
    </Resizable>
  );
}

