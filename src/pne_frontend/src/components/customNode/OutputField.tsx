import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { type OutputField } from '../../types/nodeTypes';


import RichDisplay from '../../common/RichDisplay';


interface OutputFieldComponentProps {
  path: (string | number)[];
  field: OutputField;
}

export default function OutputFieldComponent({ path, field }: OutputFieldComponentProps) {

  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;

  // Use the xyflow hook to get connections
  const connections = useNodeConnections({
    handleType: 'source',
    handleId: handleId,
  });

  const isConnected = connections.length > 0 && connections[0].sourceHandle === handleId;
  
  return (
    <div style={{position: 'relative', display: 'flex', flexDirection: 'row'}} >
      <div className='pne-div node-field-internals'>
        <div className='pne-div node-field-minified'>
          <div className='pne-div node-label-display right'>
            <strong>{`${field.user_label ?? field.label}: `}</strong>
            <RichDisplay path={path} field={field} />
          </div>
        </div>
      </div>
      
      <div className='handle-padder'/>
      <Handle 
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: isConnected ? '#4CAF50' : 'white',
          border: '1px solid black',
          borderRadius: '50%'
        }} 
        type="source" 
        position={Position.Right}
        id={handleId}
      />
    </div>
    
  );
} 