import { memo } from 'react';
import { type Node, type NodeProps } from '@xyflow/react';
import { BaseNodeData } from '../../types/nodeTypes';
import NodeHeader from './NodeHeader';
import InputFieldComponent from './InputField';
import OutputFieldComponent from './OutputField';

import './node_styles.css';

type CustomNodeData = Node<BaseNodeData & Record<string, unknown>>;

export default memo(function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
    
 
  console.log('rendering node with data', data);
  return (
    <div className='node-wrapper'>
      <NodeHeader data={data} />
      <div className='divider-div'/>
      <div className='node-field-inputs'>
        {data.inputs.map((input, index) => (
          <div key={index} className='node-field-input'>
            {index > 0 && <div className='divider-div' style={{border: '0.25px d #000'}}/>}
            <InputFieldComponent
              path={[id, 'inputs', index]}
              field={input}
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
                  path={[id, 'outputs', index]}
                  field={output} 
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});