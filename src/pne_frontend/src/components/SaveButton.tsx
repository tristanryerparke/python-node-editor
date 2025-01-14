import { Button } from '@mantine/core';
import { type ReactFlowJsonObject, useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import { saveAs } from 'file-saver';

export default function ExecuteMenu() {

  const reactFlow = useReactFlow()

  const exportFlow = useCallback(() => {
    const flow: ReactFlowJsonObject = reactFlow.toObject()
    
    // Create file content
    const fileContent = JSON.stringify(flow, null, 2)
    
    // Trigger download using FileSaver.js
    const blob = new Blob([fileContent], { type: 'application/json' })
    saveAs(blob, 'flow.json')
  }, [reactFlow])

  return <div>
    <Button 
      variant='outline'
      w='100%'
      onClick={exportFlow}
    >
      Export
    </Button>
  </div>
}