import { memo, useCallback, useContext } from 'react';
import { Node, NodeProps, useReactFlow } from '@xyflow/react';
import { Paper, Divider, Flex } from '@mantine/core';
import NodeTopBar from './NodeTopBar';
import { NodeSelectionContext } from '../../GlobalContext';
import { BaseNodeData, NodeField } from '../../types/DataTypes';

import InputField from './InputField';
import OutputField from './OutputField';

type CustomNodeData = Node<BaseNodeData & Record<string, unknown>>;

export default memo(function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
  const reactFlow = useReactFlow();

  // For when the user changes the value of an input field
  // Updates the field data based on the id and clears node outputs
  const updateNodeData = useCallback((fieldId: string, value: Partial<NodeField>) => {
    const newData = { ...data };
    // console.log('Updating node data:', fieldId, value);

    const inputIndex = newData.inputs.findIndex((input: NodeField) => input.id === fieldId);
    if (inputIndex !== -1) {
      newData.inputs[inputIndex] = { ...newData.inputs[inputIndex], ...value };
    }

    newData.outputs = newData.outputs.map(output => ({ ...output, data: null }));
    newData.status = 'not evaluated';

    reactFlow.setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, data: newData } : node))
    );
  }, [data, reactFlow]);

  const renderInputComponent = (inputField: NodeField) => (
    <InputField 
      key={`${id}-input-${inputField.label}`}
      nodeId={id} 
      inputField={inputField} 
      onChange={updateNodeData}
    />
  );

  const renderOutputComponent = (outputField: NodeField) => (
    <OutputField
      key={`${id}-output-${outputField.label}`}
      nodeId={id} 
      outputField={outputField} 
    />
  );

  const { selectedNodeId } = useContext(NodeSelectionContext);

  const getBorderStyle = () => {
    if (data.status === 'executing' ) {
      return '2px solid var(--mantine-color-green-5)';
    } else if (data.status === 'streaming') {
      return '2px solid var(--mantine-color-indigo-5)';
    } else if (id === selectedNodeId) {
      return '2px solid var(--mantine-color-blue-2)';
    }
    return 'none';
  };

  return (
    <Paper
      p='0'
      radius="md"
      bg="dark.5"
      miw='5rem'
      maw='18rem'
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        outline: getBorderStyle(),
        outlineOffset: '-2px',
        transition: 'outline 0.25s ease-in-out',
      }}
    >
      <NodeTopBar id={id} />
      <Divider orientation='horizontal' color='dark.3' w='100%'/>

      <Flex direction='column' gap='0.5rem' py='0.5rem' w='100%'>
        {data.inputs.map((inputField) => renderInputComponent(inputField))}
      </Flex>

      <Divider orientation='horizontal' color='dark.3' w='100%'/>

      <Flex direction='column' gap='0.5rem' py='0.5rem' w='100%'>
        {data.outputs.map((output) => 
          !(data.streaming && output.label === 'status') && renderOutputComponent(output)
        )}
      </Flex>
    </Paper>
  );
});