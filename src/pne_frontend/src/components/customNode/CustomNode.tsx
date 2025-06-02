import { memo } from 'react';
import { type Node, type NodeProps } from '@xyflow/react';
import { BaseNodeData } from '../../types/nodeTypes';
import NodeHeader from './NodeHeader';
import InputFieldComponent from './InputField';
import OutputFieldComponent from './OutputField';
import { Separator } from '../ui/separator';


type CustomNodeData = Node<BaseNodeData & Record<string, unknown>>;

export default memo(function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
  return (
    <div className='border border-input rounded-lg bg-background text-secondary-foreground'>
      <NodeHeader data={data} nodeId={id} />
      <Separator/>
      <div>
        {data.inputs.map((input, index) => (
          <div key={index} className='node-field-input'>
            {index > 0 && <Separator/>}
            <InputFieldComponent
              path={[id, 'inputs', index]}
              field={input}
            />
          </div>
        ))}
      </div>
      {data.outputs.length > 0 && (
        <>
          <Separator/>
          <div>
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