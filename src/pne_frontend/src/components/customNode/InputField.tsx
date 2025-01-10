import { Handle, Position, useNodeId } from '@xyflow/react';
import { type InputField } from '../../types/nodeTypes';
import { useEdgeConnection } from '../../hooks/useEdgeConnection';
import ChevronButton from '../../common/ChevronButton';
import type { Direction } from '../../common/ChevronButton';
import ShortDisplay from '../../common/MinifiedDisplay';
import DebugDisplay from '../../common/DebugDisplay';

interface InputFieldProps {
  field: InputField;
  index: number;
  updateField: (newField: InputField, index: number) => void;
}

export default function InputFieldComponent({ field, index, updateField }: InputFieldProps) {
  const nodeId = useNodeId();
  const isConnected = useEdgeConnection({ field, index, updateField });
  const isExpanded = field.metadata?.expanded ?? false;

  const handleDirectionChange = (direction: Direction) => {
    updateField({
      ...field,
      metadata: {
        ...field.metadata,
        expanded: direction === 'down'
      }
    }, index);
  };

  return (
    <div style={{position: 'relative', display: 'flex', flexDirection: 'row'}} >
      <Handle 
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: isConnected ? '#4CAF50' : 'white',
          border: '1px solid black',
          borderRadius: '50%'
        }} 
        type="target" 
        position={Position.Left}
        id={`${nodeId}-input-${index}`}
      />
      <div className='pne-div node-field-internals left'>
        <div className='pne-div node-field-minified'>
          <div className='pne-div node-label-display left'>
            <strong>{`${field.user_label ?? field.label}:  `}</strong>
            <ShortDisplay data={field.data} />
            
            
          </div>
          <ChevronButton 
            direction={isExpanded ? 'down' : 'up'}
            onChange={(direction) => handleDirectionChange(direction)}
          />
        </div>
        {isExpanded && <DebugDisplay data={field.data} />}
      </div>
      
    </div>
  );
}