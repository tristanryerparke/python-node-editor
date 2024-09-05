import { useReactFlow, type Edge, type ReactFlowJsonObject } from '@xyflow/react';
import { useCallback, useState, useContext } from 'react';
import { FlowFileObject } from '../types/DataTypes';
import { FlowMetadataContext } from '../GlobalContext';

export function useSaveFlow() {
    const reactFlow = useReactFlow();
    const [isSaving, setIsSaving] = useState(false);
    const { filename } = useContext(FlowMetadataContext);

    const saveFlow = useCallback(async () => {
        setIsSaving(true);
        try {
            // create the file and populate the embedded data attribute
            const rawFlow: ReactFlowJsonObject = reactFlow.toObject();
            const flow: FlowFileObject = {
                ...rawFlow,
                embedded_data: {},
                metadata: {
                    filename: filename,
                }
            };
            console.log('flow', flow);
            for (const node of flow.nodes) {
                node.data.status = 'not evaluated';
                if (node.data && node.data.inputs && Array.isArray(node.data.inputs)) {
                    for (const inputField of node.data.inputs) {
                        const handleId = `${node.id}-input-${inputField.label}`;
                        const isEdgeConnected = flow.edges.some((edge: Edge) => edge.target === node.id && edge.targetHandle === handleId);
                        
                        if (!isEdgeConnected && inputField.data && inputField.cached) {
                            console.log('found input to cache');
                            try {
                                const response = await fetch(`http://localhost:8000/full_data/${inputField.id}?dtype=${inputField.dtype}`);
                                if (response.ok) {
                                    const fullData = await response.text();
                                    flow.embedded_data[inputField.id] = fullData.replace(/"/g, '');
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
            a.download = `${filename}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsSaving(false);
        }
    }, [reactFlow, filename]);

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
                            for (const inputField of node.data.inputs) {
                                const handleId = `${node.id}-input-${inputField.label}`;
                                const isEdgeConnected = flow.edges.some((edge: Edge) => edge.target === node.id && edge.targetHandle === handleId);
                                
                                if (!isEdgeConnected && inputField.data && inputField.cached) {
                                    // we can't use a copy here because it caused issues when instatiating data on the backend
                                    const jsonRepresentation = {
                                        dtype: inputField.dtype,
                                        data: flow.embedded_data[inputField.id],
                                        id: inputField.id,
                                        label: inputField.label,
                                        field_type: inputField.field_type,
                                    };
                                    const formData = new FormData();
                                    const blob = new Blob([JSON.stringify(jsonRepresentation)], { type: 'application/json' });
                                    formData.append('file', blob, 'large_data.json');
                                    formData.append('original_filename', 'embedded_data');
                                    formData.append('file_extension', 'json');
                                    
                                    try {
                                        const response = await fetch('http://localhost:8000/large_file_upload', {
                                            method: 'POST',
                                            body: formData,
                                        });
                                        if (response.ok) {
                                            const data = await response.json();
                                            inputField.data = data;
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