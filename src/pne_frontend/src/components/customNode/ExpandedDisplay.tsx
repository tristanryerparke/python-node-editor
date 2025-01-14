import { Switch } from '@mantine/core';


import { type InputField } from "../../types/nodeTypes";

import DebugDisplay from "../../common/DebugDisplay";
import PrettyDisplay from "../../common/PrettyDisplay";
import { useState } from 'react';

interface ExpandedDisplayProps {
  field: InputField,
  updateField: (field: InputField, index: number) => void,
  index: number
}


export default function ExpandedDisplay({ 
  field, 
  updateField,
  index 
}: ExpandedDisplayProps) {
  const [displayType, setDisplayType] = useState<'Debug' | 'Pretty'>('Debug');
  
  return <div className="pne-div" style={{gap: '0.25rem'}}>
    <div className='pne-div' style={{alignItems: 'center'}}>
      <div className="pne-div shrink" style={{
        flexDirection: 'row', 
        justifyItems: 'space-between',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        <div>Debug</div>
        <Switch
          variant="outline"
          value={displayType}
          onChange={(event) => setDisplayType(event.target.checked ? 'Pretty' : 'Debug')}
        />
          <div>Pretty</div>
        </div>
      </div>
    {displayType === 'Debug' && <DebugDisplay data={field.data} />}
    {displayType === 'Pretty' && (
      <PrettyDisplay 
        field={field} 
        updateField={updateField} 
        index={index} 
      />
    )}
  </div>
}