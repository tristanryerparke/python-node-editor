import { memo, useCallback, useContext } from 'react';
import { Node, NodeProps, useReactFlow } from '@xyflow/react';
import { Paper, Divider, Flex } from '@mantine/core';
import NodeTopBar from './node-elements/NodeTopBar';
import { NodeSelectionContext, AutoExecuteContext } from '../GlobalContext';
import { BaseNodeData, NodeInput, NodeOutput } from '../types/DataTypes';

import InputField from './node-elements/InputField';
import OutputField from './node-elements/OutputField';

type CustomNodeData = Node<BaseNodeData & Record<string, unknown>>;

export default memo(function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
  const reactFlow = useReactFlow();

  const updateNodeData = useCallback((label: string, value: any) => {
    console.log('updating node data', label, value);


    const newData = { ...data };

    const inputIndex = newData.inputs.findIndex((input: NodeInput) => input.label === label);
    if (inputIndex !== -1) {
      newData.inputs[inputIndex].input_data = value;
    }

    newData.outputs = newData.outputs.map(output => ({ ...output, output_data: null }));
    newData.status = 'not evaluated';

    reactFlow.setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, data: newData } : node))
    );

  }, [data, reactFlow, id]);

  const renderInputComponent = (input: NodeInput) => (
    <InputField 
      key={`${id}-input-${input.label}`}
      nodeId={id} 
      input={input} 
      onChange={updateNodeData}
    />
  );

  const renderOutputComponent = (output: NodeOutput) => (
    <OutputField
      key={`${id}-output-${output.label}`}
      nodeId={id} 
      output={output} 
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
      miw='10rem'
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
        {data.inputs.map((input) => renderInputComponent(input))}
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