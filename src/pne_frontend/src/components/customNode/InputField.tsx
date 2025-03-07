import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { type InputField } from '../../types/nodeTypes';
import { DisplayModeButton } from '../../common/DisplayModeButton';
import RichDisplay from '../../common/RichDisplay';

interface InputFieldProps {
  path: (string | number)[];
  field: InputField;
}

export default function InputFieldComponent({ path, field }: InputFieldProps) {
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;

  // Use the xyflow hook to get connections
  const connections = useNodeConnections({
    handleType: 'target',
    handleId: handleId,
  });

  // Determine if connected based on connections array length and target node id
  const isConnected = connections.length > 0 && connections[0].targetHandle === handleId;
  const displayMode = (field.metadata?.displayMode ?? 'Pretty') as 'Debug' | 'Pretty';

  // Set handle color based on connection state
  const handleColor = isConnected ? '#4CAF50' : 'white';

  return (
    <div style={{position: 'relative', display: 'flex', flexDirection: 'row'}} >
      <Handle 
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: handleColor,
          border: '1px solid black',
          borderRadius: '50%'
        }} 
        type="target" 
        position={Position.Left}
        id={handleId}
      />
      <div className='pne-div node-field-internals left'>
        <strong style={{height: '20px'}}>{`${field.user_label ?? field.label}:  `}</strong>
        <RichDisplay path={path} field={field} />
          <DisplayModeButton
            displayMode={displayMode}
            setDisplayMode={() => {}}
          />
      </div>
    </div>
  );
}