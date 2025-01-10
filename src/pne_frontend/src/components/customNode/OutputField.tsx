import { Handle, Position, useNodeId } from '@xyflow/react';
import { type OutputField } from '../../types/nodeTypes';
import ChevronButton from '../../common/ChevronButton';
import type { Direction } from '../../common/ChevronButton';
import DebugDisplay from '../../common/DebugDisplay';

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
      <div className='node-field-internals' style={{ height: isExpanded ? '120px' : 'auto', transition: 'height 0.2s ease-in-out' }}>
        <ChevronButton 
          direction={isExpanded ? 'down' : 'up'}
          onChange={(direction) => handleDirectionChange(direction)}
        />
        <div className='node-label-display'>
          {field.user_label ?? field.label} 
          ({field.data?.class_name ?? 'no type'}):
          {String(field.data?.payload ?? 'no data')}
          
          
        </div>
        
      </div>
      {isExpanded && <DebugDisplay data={field.data} />}
    </div>
    
  );
} 