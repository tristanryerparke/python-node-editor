import { Switch } from '@mantine/core';


import { type InputField } from "../../types/nodeTypes";

import DebugDisplay from "../../common/DebugDisplay";
import PrettyDisplay from "../../common/PrettyDisplay";
import { useState } from 'react';

interface ExpandedDisplayProps {
  field: InputField,
  updateField: (field: InputField, index: number) => void,
  index: number,
  displayMode: 'Debug' | 'Pretty',
  setDisplayMode: React.Dispatch<React.SetStateAction<'Debug' | 'Pretty'>>
}

export default function ExpandedDisplay({ 
  field, 
  updateField,
  index,
  displayMode,
  setDisplayMode
}: ExpandedDisplayProps) {
  return <div className="pne-div" style={{gap: '0.25rem'}}>
    {displayMode === 'Debug' && <DebugDisplay data={field.data} />}
    {displayMode === 'Pretty' && (
      <PrettyDisplay 
        field={field} 
        updateField={updateField} 
        index={index} 
      />
    )}
  </div>
}