import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { type InputField } from '../../types/nodeTypes';
import RichDisplay from '../../common/RichDisplay';
import { EdgeConnectedProvider } from '../../contexts/edgeConnectedContext';


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

  // Set handle color based on connection state
  // const handleColor = isConnected ? '#4CAF50' : 'white';

  return (
    <div className="relative w-full" >
      <Handle 
        className="h-4 w-4 rounded-full bg-primary"
        type="target" 
        position={Position.Left}
        id={handleId}
      />
      <div className="flex w-full pl-3 pr-2 py-2 gap-1 overflow-hidden">
        <div className="flex items-center flex-shrink-0 font-bold">
          {field.user_label ?? field.label}{':'}
        </div>
        <EdgeConnectedProvider isConnected={isConnected}>
          <RichDisplay path={path} field={field} />
        </EdgeConnectedProvider>
      </div>
    </div>
  );
}