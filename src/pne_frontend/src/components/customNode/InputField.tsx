import { Handle, Position, useNodeId } from '@xyflow/react';
import { type InputField } from '../../types/nodeTypes';
import { useEdgeConnection } from '../../hooks/useEdgeConnection';
import { type Direction, ChevronButton } from '../../common/ChevronButton';
import MinifiedDisplay from '../../common/MinifiedDisplay';
import ExpandedDisplay from './ExpandedDisplay';
import { AnyData } from '../../types/dataTypes/anyData';
import { FieldContext } from '../../contexts/FieldContext';

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
      <FieldContext.Provider value={{ field, updateField, index }}>
        <div className='pne-div node-field-internals left'>
          <div className='pne-div node-field-minified'>
            <div className='pne-div node-label-display left'>
              <strong>{`${field.user_label ?? field.label}:  `}</strong>
              <MinifiedDisplay data={field.data as AnyData } />
            </div>
            <ChevronButton 
              direction={isExpanded ? 'down' : 'up'}
              onChange={(direction) => handleDirectionChange(direction)}
            />
          </div>
          {isExpanded && <ExpandedDisplay field={field} updateField={updateField} index={index} />}
        </div>
      </FieldContext.Provider>
    </div>
  );
}