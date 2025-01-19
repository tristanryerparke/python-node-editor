import { Handle, Position, useNodeId } from '@xyflow/react';
import { type InputField } from '../../types/nodeTypes';
import { useEdgeConnection } from '../../hooks/useEdgeConnection';
import { type Direction, ChevronButton } from '../../common/ChevronButton';
import ExpandedDisplay from './ExpandedDisplay';
import { AnyData } from '../../types/dataTypes/anyData';
import { FieldContext } from '../../contexts/FieldContext';
import { DisplayModeButton } from '../../common/DisplayModeButton';
import PrettyDisplay from '../../common/PrettyDisplay';
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
  const displayMode = (field.metadata?.displayMode ?? 'Debug') as 'Debug' | 'Pretty';

  const handleDirectionChange = (direction: Direction) => {
    updateField({
      ...field,
      metadata: {
        ...field.metadata,
        expanded: direction === 'down'
      }
    }, index);
  };

  function handleDisplayModeChange(newMode: 'Debug' | 'Pretty') {
    updateField({
      ...field,
      metadata: {
        ...field.metadata,
        displayMode: newMode
      }
    }, index);
  }

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
              {displayMode === 'Pretty' ? (
                <PrettyDisplay field={field} updateField={updateField} index={index} />
              ) : (
                <DebugDisplay data={field.data as AnyData} />
              )}
            </div>
            <ChevronButton 
              direction={isExpanded ? 'down' : 'up'}
              onChange={(direction) => handleDirectionChange(direction)}
            />
            <DisplayModeButton
              displayMode={displayMode}
              setDisplayMode={handleDisplayModeChange}
            />
          </div>
          {isExpanded && (
            <ExpandedDisplay 
              field={field} 
              updateField={updateField} 
              index={index}
              displayMode={displayMode}
              setDisplayMode={handleDisplayModeChange}
            />
          )}
        </div>
      </FieldContext.Provider>
    </div>
  );
}