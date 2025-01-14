import { memo, useCallback } from 'react';
import { useReactFlow, type Node, type NodeProps } from '@xyflow/react';
import { BaseNodeData, OutputField } from '../../types/nodeTypes';
import NodeHeader from './NodeHeader';
import { type InputField } from '../../types/nodeTypes';
import InputFieldComponent from './InputField';
import OutputFieldComponent from './OutputField';

import './node_styles.css';

type CustomNodeData = Node<BaseNodeData & Record<string, unknown>>;

export default memo(function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
  const reactFlow = useReactFlow();
  // Function to update the field that is passed to the InputField component
  const setInputField = useCallback((newField: InputField, index: number) => {
    const newData = { ...data };

    newData.inputs = [...newData.inputs];
    newData.inputs[index] = newField as InputField;
    
    reactFlow.setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, data: newData } : node))
    );
  }, [data, reactFlow, id]);

  const setOutputField = useCallback((newField: OutputField, index: number) => {
    const newData = { ...data };

    newData.outputs = [...newData.outputs];
    newData.outputs[index] = newField as OutputField;
    
    reactFlow.setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, data: newData } : node))
    );
  }, [data, reactFlow, id]);

  return (
    <div className='node-wrapper'>
      <NodeHeader data={data} />
      <div className='divider-div'/>
      <div className='node-field-inputs'>
        {data.inputs.map((input, index) => (
          <div key={index} className='node-field-input'>
            {index > 0 && <div className='divider-div'/>}
            <InputFieldComponent
              field={input}
              index={index}
              updateField={setInputField}
            />
          </div>
        ))}
      </div>
      {data.outputs.length > 0 && (
        <>
          <div className='divider-div'/>
          <div className='node-field-outputs'>
            {data.outputs.map((output, index) => (
              <div key={index} className='node-field-output'>
                {index > 0 && <div className='divider-div'/>}
                <OutputFieldComponent 
                  field={output} 
                  index={index}
                  updateField={setOutputField} 
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});