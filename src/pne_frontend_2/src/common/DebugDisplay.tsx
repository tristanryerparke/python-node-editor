import { BaseData, ListData, ModelData } from "../types/dataTypes";

const isBasicData = (data: BaseData): data is BaseData => {
  return ['IntData', 'FloatData', 'StringData', 'BoolData'].includes(data.class_name);
}

const isListData = (data: BaseData): data is ListData => {
  return data.class_name === 'ListData';
}

const isModelData = (data: BaseData): data is ModelData => {
  return data.class_name === 'ModelData';
}

function Render(data: BaseData, runningIndent: number = 0, padObject: string = '   ', currentKey?: string): string {
  const indentStr = padObject.repeat(runningIndent);
  const keyDisplay = currentKey ? `${currentKey}: ` : '';

  if (isBasicData(data)) {
    return `${indentStr}${keyDisplay}${data.class_name}: ${data.payload}\n`;
  } else if (isListData(data)) {
    const lines: string[] = [];
    if (currentKey) {
      lines.push(`${indentStr}${keyDisplay}${data.class_name}[\n`);
    } else {
      lines.push(`${indentStr}${data.class_name}[\n`);
    }
    data.payload.forEach(item => {
      lines.push(Render(item, runningIndent + 1, padObject));
    });
    lines.push(`${indentStr}]\n`);
    return lines.join('');
  } else if (isModelData(data)) {
    const lines: string[] = [];
    if (currentKey) {
      lines.push(`${indentStr}${keyDisplay}${data.class_name}(\n`);
    } else {
      lines.push(`${indentStr}${data.class_name}(\n`);
    }
    Object.entries(data.payload).forEach(([key, value]) => {
      lines.push(Render(value, runningIndent + 1, padObject, key));
    });
    lines.push(`${indentStr})\n`);
    return lines.join('');
  }
  return `${indentStr}unknown data type: ${(data as any).class_name}\n`;
}




export default function DebugDisplay({ data }: { data: BaseData }) {
  // console.log(data);
  return <div
    className='pne-div nodrag nopan noscroll'
    style={{
      cursor: 'text',
      userSelect: 'text',
      padding: '0.5rem',
      border: '1px solid black',
      borderRadius: '0.25rem',
      display: 'flex',
      whiteSpace: 'pre',
      // overflow: 'hidden'
    }}
  >{Render(data)}</div>;
}