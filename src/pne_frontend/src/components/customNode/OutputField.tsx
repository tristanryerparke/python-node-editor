import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { type OutputField } from '../../types/nodeTypes';
import { EdgeConnectedProvider } from '../../contexts/edgeConnectedContext';

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

  // Determine if connected based on connections array length and source node id
  const isConnected = connections.length > 0 && connections[0].sourceHandle === handleId;

  return (
    <div className="relative w-full" >
      <Handle 
        className="h-4 w-4 rounded-full bg-primary"
        type="source" 
        position={Position.Right}
        id={handleId}
      />
      <div className="flex w-full pl-2 pr-3 py-2 gap-1 overflow-hidden">
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