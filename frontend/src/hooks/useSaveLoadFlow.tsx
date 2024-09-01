import { useReactFlow } from '@xyflow/react';
import { useCallback, useState } from 'react';

export function useSaveFlow() {
    const reactFlow = useReactFlow();
    const [isSaving, setIsSaving] = useState(false);

    const saveFlow = useCallback(async () => {
        setIsSaving(true);
        try {
            const flow = reactFlow.toObject();
            flow.embedded_data = {};
            
            for (const node of flow.nodes) {
                node.data.status = 'not evaluated';
                if (node.data && node.data.inputs && Array.isArray(node.data.inputs)) {
                    for (const input of node.data.inputs) {
                        const handleId = `${node.id}-input-${input.label}`;
                        const isEdgeConnected = flow.edges.some(edge => edge.target === node.id && edge.targetHandle === handleId);
                        
                        if (!isEdgeConnected && input.input_data && input.input_data.cached) {
                            console.log('found input to cache');
                            try {
                                const response = await fetch(`http://localhost:8000/data/${input.input_data.id}?dtype=${input.input_data.dtype}`);
                                if (response.ok) {
                                    
                                    const fullData = await response.text();
                                    flow.embedded_data[input.input_data.id] = fullData.replace(/"/g, '');
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
    const reactFlow = useReactFlow();
    const [isLoading, setIsLoading] = useState(false);

    const loadFlow = useCallback(async (file: File) => {
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const flow = JSON.parse(event.target?.result as string);
                
                if (flow.embedded_data) {
                    for (const node of flow.nodes) {
                        node.data.status = 'not evaluated';
                        if (node.data && node.data.inputs && Array.isArray(node.data.inputs)) {
                            for (const input of node.data.inputs) {
                                const handleId = `${node.id}-input-${input.label}`;
                                const isEdgeConnected = flow.edges.some(edge => edge.target === node.id && edge.targetHandle === handleId);
                                
                                if (!isEdgeConnected && input.input_data && input.input_data.cached) {
                                    // prep the data to be sent to the backend
                                    const jsonRepresentation = {
                                        dtype: input.input_data.dtype,
                                        data: flow.embedded_data[input.input_data.id],
                                        id: input.input_data.id
                                    };
                                    const formData = new FormData();
                                    const blob = new Blob([JSON.stringify(jsonRepresentation)], { type: 'application/json' });
                                    formData.append('file', blob, 'large_data.json');
                                    formData.append('original_filename', 'embedded_data');
                                    formData.append('file_extension', 'json');
                                    
                                    // send the large data to the backend and replace the cached data with the full data
                                    try {
                                        const response = await fetch('http://localhost:8000/large_file_upload', {
                                            method: 'POST',
                                            body: formData,
                                        });
                                        if (response.ok) {
                                            const data = await response.json();
                                            input.input_data.data = data;
                                        }
                                    } catch (error) {
                                        console.error('Error fetching full data:', error);
                                    }
                                }
                            }
                        }
                    }
                }

                reactFlow.setNodes(flow.nodes);
                reactFlow.setEdges(flow.edges);
                
                // Set the viewport if it exists in the loaded flow
                if (flow.viewport) {
                    reactFlow.setViewport(flow.viewport);
                }
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
    }, [reactFlow]);

    return { loadFlow, isLoading };
}