import { useEffect, useContext, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { AppContext, FlowMetadataContext } from '../GlobalContext';
import { FlowFileObject } from '../types/BaseDataTypes';

const AUTOSAVE_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

export function useAutoSave() {
  const { setLastAutosaved } = useContext(AppContext);
  const { filename } = useContext(FlowMetadataContext);
  const reactFlow = useReactFlow();

  const saveFlow = useCallback(() => {
    const rawFlow = reactFlow.toObject();
    const flowFileObject: FlowFileObject = {
      ...rawFlow,
      embedded_data: {},
      metadata: {
        filename: filename
      }
    };


    // Send the data to the server (you might want to adjust this part based on your server setup)
    fetch('http://localhost:8000/autosave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flowFileObject),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Autosave successful:', data);
      setLastAutosaved(new Date());
    })
    .catch(error => {
      console.error('Autosave failed:', error);
    });
  }, [reactFlow, filename, setLastAutosaved]);

  useEffect(() => {
    const intervalId = setInterval(saveFlow, AUTOSAVE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [saveFlow]);
}