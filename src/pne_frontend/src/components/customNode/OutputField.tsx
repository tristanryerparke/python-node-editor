import { Handle, Position, useNodeId } from '@xyflow/react';
import { type OutputField } from '../../types/nodeTypes';
import { ChevronButton } from '../../common/ChevronButton';
import type { Direction } from '../../common/ChevronButton';

import PrettyDisplay from '../../common/PrettyDisplay';


interface OutputFieldComponentProps {
  field: OutputField;
  index: number;
  updateField: (newField: OutputField, index: number) => void;
}

export default function OutputFieldComponent({ field, index, updateField }: OutputFieldComponentProps) {
  const nodeId = useNodeId();
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
      <div className='pne-div node-field-internals'>
        <div className='pne-div node-field-minified'>
          <ChevronButton 
            direction={isExpanded ? 'down' : 'up'}
            onChange={(direction) => handleDirectionChange(direction)}
          />
          <div className='pne-div node-label-display right'>
            <strong>{`${field.user_label ?? field.label}: `}</strong>
            <PrettyDisplay field={field} updateField={updateField} index={index} />
          </div>
        </div>
      </div>
      
      <div className='handle-padder'/>
      <Handle 
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'white',
          border: '1px solid black',
          borderRadius: '50%'
        }} 
        type="source" 
        position={Position.Right}
        id={`${nodeId}-output-${index}`}
      />
    </div>
    
  );
} 