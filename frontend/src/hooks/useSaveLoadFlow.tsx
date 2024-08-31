import { useReactFlow } from '@xyflow/react';
import { useCallback, useState } from 'react';

export function useSaveFlow() {
    const reactFlow = useReactFlow();
    const [isSaving, setIsSaving] = useState(false);

    const saveFlow = useCallback(async () => {
        // retrieves the data for cached unconnected inputs and saves the flow
        setIsSaving(true);
        try {
            const flow = reactFlow.toObject();
            
            // Process nodes to include full data for unconnected inputs
            for (const node of flow.nodes) {
                node.data.status = 'not evaluated';
                if (node.data && node.data.inputs && Array.isArray(node.data.inputs)) {
                    for (const input of node.data.inputs) {
                        if (input.input_data && input.input_data.cached) {
                            try {
                                const response = await fetch(`http://localhost:8000/data/${input.input_data.id}?dtype=${input.input_data.dtype}`);
                                if (response.ok) {
                                    const fullData = await response.text();
                                    input.input_data.data = fullData;
                                }
                            } catch (error) {
                                console.error('Error fetching full data:', error);
                            }
                        }
                    }
                }
            }

            const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flow.json';
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsSaving(false);
        }
    }, [reactFlow]);

    return { saveFlow, isSaving };
}

export function useLoadFlow() {
    // loads a flow from a file and uploads the data for cached inputs
    const reactFlow = useReactFlow();
    const [isLoading, setIsLoading] = useState(false);

    const loadFlow = useCallback(async (file: File) => {
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const flow = JSON.parse(event.target?.result as string);
                
                // Process nodes to upload full data for cached inputs
                for (const node of flow.nodes) {
                    if (node.data && node.data.inputs) {
                        for (const input of node.data.inputs) {
                            if (input.input_data && input.input_data.cached && input.input_data.data) {
                                const jsonRepresentation = {
                                    dtype: input.input_data.dtype,
                                    data: input.input_data.data,
                                };

                                const formData = new FormData();
                                const blob = new Blob([JSON.stringify(jsonRepresentation)], { type: 'application/json' });
                                formData.append('file', blob, 'large_data.json');
                                formData.append('original_filename', input.input_data.description || 'unknown');
                                formData.append('file_extension', 'json');

                                try {
                                    const response = await fetch('http://localhost:8000/large_file_upload', {
                                        method: 'POST',
                                        body: formData,
                                    });

                                    if (response.ok) {
                                        const result = await response.json();
                                        input.input_data = result;
                                    } else {
                                        console.error('Failed to upload large file');
                                    }
                                } catch (error) {
                                    console.error('Error uploading large file:', error);
                                }
                            }
                        }
                    }
                    node.data.status = 'not evaluated';
                }

                reactFlow.setNodes(flow.nodes);
                reactFlow.setEdges(flow.edges);
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
    }, [reactFlow]);

    return { loadFlow, isLoading };
}