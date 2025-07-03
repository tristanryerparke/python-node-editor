import { Button } from "@/components/ui/button";
import { type ReactFlowJsonObject, useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import { saveAs } from 'file-saver';

export default function SaveButton() {
  const reactFlow = useReactFlow();

  const exportFlow = useCallback(() => {
    const flow: ReactFlowJsonObject = reactFlow.toObject();
    const fileContent = JSON.stringify(flow, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    saveAs(blob, 'flow.json');
  }, [reactFlow]);

  return (
    <div className='w-full'>
      <Button
        className='w-full'
        onClick={exportFlow}
      >
        Export
      </Button>
    </div>
  );
}