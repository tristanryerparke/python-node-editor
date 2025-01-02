import basicData from './basic_data.json' assert { type: 'json' }
import listData from './list_data.json' assert { type: 'json' }
import modelData from './model_data.json' assert { type: 'json' }
import nestedModelData from './nested_model_data.json' assert { type: 'json' }
import { MantineProvider, Textarea, TypographyStylesProvider } from '@mantine/core';
import { IntInput, StringInput, InputDefinition, InputField } from './Inputs';
import { CreateDataObject } from './dataCreation';
import { z } from 'zod';
import '@mantine/core/styles.css';

interface BasicData {
  class_name: 'IntData' | 'FloatData' | 'StringData' | 'BoolData';
  payload: number | string | boolean;
}

interface ListData {
  class_name: 'ListData';
  payload: (BasicData | ListData | ModelData)[];
}

interface ModelData {
  class_name: 'ModelData';
  payload: Record<string, BasicData | ListData | ModelData>;
}

type DataType = BasicData | ListData | ModelData;

const isBasicData = (data: DataType): data is BasicData => {
  return ['IntData', 'FloatData', 'StringData', 'BoolData'].includes(data.class_name);
}

const isListData = (data: DataType): data is ListData => {
  return data.class_name === 'ListData';
}

const isModelData = (data: DataType): data is ModelData => {
  return data.class_name === 'ModelData';
}

function Render(data: DataType, runningIndent: number = 0, padObject: string = '   ', currentKey?: string): string {
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

function RenderHTML(data: DataType, runningIndent: number = 0, padObject: string = '&nbsp;&nbsp;&nbsp;', currentKey?: string): string {
  const indentStr = padObject.repeat(runningIndent);
  const keyDisplay = currentKey ? `<span class="key"><i>${currentKey}</i></span>: ` : '';

  if (isBasicData(data)) {
    return `${indentStr}${keyDisplay}(${data.class_name}) ${data.payload}<br/>`;
  } else if (isListData(data)) {
    const lines: string[] = [];
    if (currentKey) {
      lines.push(`${indentStr}${keyDisplay}<b>${data.class_name}[</b><br/>`);
    } else {
      lines.push(`${indentStr}<b>${data.class_name}[</b><br/>`);
    }
    data.payload.forEach(item => {
      lines.push(RenderHTML(item, runningIndent + 1, padObject));
    });
    lines.push(`<b>${indentStr}]</b><br/>`);
    return lines.join('');
  } else if (isModelData(data)) {
    const lines: string[] = [];
    if (currentKey) {
      lines.push(`${indentStr}${keyDisplay}<b>${data.class_name}{</b><br/>`);
    } else {
      lines.push(`${indentStr}<b>${data.class_name}{</b><br/>`);
    }
    Object.entries(data.payload).forEach(([key, value]) => {
      lines.push(RenderHTML(value, runningIndent + 1, padObject, key));
    });
    lines.push(`<b>${indentStr}}</b><br/>`);
    return lines.join('');
  }
  return `${indentStr}unknown data type: ${(data as DataType).class_name}<br/>`;
}

const style = {
  fontSize: '12px'
}

const BasicRender = () => {
  return (
    <div>
      <h3 style={{ color: 'blue' }}>Basic Data:</h3>
      <Textarea
        value={Render(basicData as BasicData)}
        readOnly
        autosize
        minRows={2}
        style={{ flexGrow: 1 }}
        styles={{ input: style }}
      />
      
      <h3 style={{ color: 'blue' }}>List Data:</h3>
      <Textarea
        value={Render(listData as ListData)}
        readOnly
        autosize
        minRows={2}
        styles={{ input: style }}
      />
      
      <h3 style={{ color: 'blue' }}>Model Data:</h3>
      <Textarea
        value={Render(modelData as ModelData)}
        readOnly
        autosize
        minRows={2}
        styles={{ input: style }}
      />

      <h3 style={{ color: 'blue' }}>Nested Model Data:</h3>
      <Textarea
        value={Render(nestedModelData as ModelData)}
        readOnly
        autosize
        minRows={2}
        styles={{ input: style }}
      />
    </div>
  );
}

const HTMLRender = () => {
  return (
    <div style={{ overflowY: 'scroll' }}>
      <h3 style={{ color: 'blue' }}>Basic Data (HTML):</h3>
      <TypographyStylesProvider>
        <div 
          style={{ 
            whiteSpace: 'pre',
            fontFamily: 'monospace',
            fontSize: '14px'
          }} 
          dangerouslySetInnerHTML={{ __html: RenderHTML(basicData as BasicData) }} 
        />
      </TypographyStylesProvider>
      
      <h3 style={{ color: 'blue' }}>List Data (HTML):</h3>
      <TypographyStylesProvider>
        <div 
          style={{ 
            whiteSpace: 'pre',
            fontFamily: 'monospace',
            fontSize: '14px'
          }} 
          dangerouslySetInnerHTML={{ __html: RenderHTML(listData as ListData) }} 
        />
      </TypographyStylesProvider>
      
      <h3 style={{ color: 'blue' }}>Model Data (HTML):</h3>
      <TypographyStylesProvider>
        <div 
          style={{ 
            whiteSpace: 'pre',
            fontFamily: 'monospace',
            fontSize: '14px'
          }} 
          dangerouslySetInnerHTML={{ __html: RenderHTML(modelData as ModelData) }} 
        />
      </TypographyStylesProvider>

      <h3 style={{ color: 'blue' }}>Nested Model Data (HTML):</h3>
      <TypographyStylesProvider>
        <div 
          style={{ 
            whiteSpace: 'pre',
            fontFamily: 'monospace',
            fontSize: '14px'
          }} 
          dangerouslySetInnerHTML={{ __html: RenderHTML(nestedModelData as ModelData) }} 
        />
      </TypographyStylesProvider>
    </div>
  );
}

// this is how the input might get sent up from the backend
const intInputDef: InputField = {
  data: {
    class_name: 'IntData',
    payload: 100,
    id: '985dbbb4-0bfb-45b9-9405-d33899db9931'
  },
  allowed_types: ['IntData'],
  input_display_generate: 'IntData',
  display_type: 'input'
}

const stringInputDef: InputField = {
  data: null,
  allowed_types: ['StringData'],
  input_display_generate: 'StringData',
  display_type: 'input'
}

function updateInputDef(field: InputField, value: unknown) {
  
  const oldData = field.data?.payload;
  // Don't update if the value is the same
  if (oldData !== value) {
    try {
      const newData = CreateDataObject(field.input_display_generate, value);
      // Check if the class_name is in allowed_types before updating
      if (field.allowed_types.includes(newData.class_name)) {
        field.data = newData;
        console.log('Input updated successfully:', field);
      } else {
        console.error(`Class name ${newData.class_name} not in allowed types: ${field.allowed_types}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
      } else {
        console.error('Error creating data object:', error);
      }
      // Clear the data when there's an error
      field.data = null;
    }
  }
}

function App() {
  return (
    <MantineProvider>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
        <IntInput field={intInputDef} onUpdate={updateInputDef} />
        <StringInput field={stringInputDef} onUpdate={updateInputDef} />
      </div>
    </MantineProvider>
  )
}

export default App;
