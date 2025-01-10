import { BaseData, ModelData } from "../types/dataTypes";
import { isBasicData, isListData, isModelData, isImageData } from "../utils/dataUtils";

function Render(data: BaseData | ModelData , runningIndent: number = 0, padObject: string = '   ', currentKey?: string): string {
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
    return `${indentStr}${keyDisplay}${data.class_name}: ${data.payload}\n`;
  } else if (isListData(data)) {
    const lines: string[] = [];
    lines.push(`${indentStr}${keyDisplay}${data.class_name}[\n`);
    data.payload.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        lines.push(Render(item as BaseData, runningIndent + 1, padObject));
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
        lines.push(Render(value as BaseData, runningIndent + 1, padObject, key));
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
  } else {
    // Default case to handle unexpected data types
    return `${indentStr}${keyDisplay}unknown data type\n`;
  }
}




export default function DebugDisplay({ data }: { data: BaseData }) {
  // console.log(data);
  return <div
    className='pne-div nodrag nopan nowheel'
    style={{
      cursor: 'text',
      WebkitUserSelect: 'text', // Add webkit prefix
      userSelect: 'text',
      padding: '0.5rem', 
      border: '1px solid black',
      borderRadius: '0.25rem',
      display: 'flex',
      whiteSpace: 'pre',
      overflow: 'scroll',
      MozUserSelect: 'text', // Add Firefox support
      msUserSelect: 'text', // Add IE support
    }}
  >{Render(data)}</div>;
}

