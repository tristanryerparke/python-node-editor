import { memo, useCallback, useContext } from 'react';
import { Handle, Node, NodeProps, useNodesData, useReactFlow } from '@xyflow/react';
import { Paper, Divider, Flex } from '@mantine/core';
import { TextInputHandle, TextOutputHandle } from './node-elements/TextHandles';
import { NumberInputHandle, NumberOutputHandle } from './node-elements/NumberHandles';
import { ImageInputHandle, ImageOutputHandle } from './node-elements/ImageHandles';

import NodeTopBar from './node-elements/NodeTopBar';
import { NodeSelectionContext, AutoExecuteContext } from '../GlobalContext';
import { useExecutionManager } from '../hooks/useExecutionManager';
import { BaseNodeData, NodeInput, NodeOutput } from '../types/DataTypes';

import InputField from './node-elements/InputField';
import OutputField from './node-elements/OutputField';

type CustomNodeData = Node<BaseNodeData & Record<string, unknown>>;

export default memo(function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
  const reactFlow = useReactFlow();
  const { autoExecute } = useContext(AutoExecuteContext);
  const { debouncedExecute } = useExecutionManager();

  const nodeData = useNodesData(id)?.data as unknown as BaseNodeData;

  const updateNodeData = useCallback((label: string, value: any) => {
    const newData = { ...nodeData };

    // set the value of the input
    const inputIndex = newData.inputs.findIndex((input: NodeInput) => input.label === label);    if (inputIndex !== -1) {
      newData.inputs[inputIndex].value = value;
    }

    // set all outputs to null
    newData.outputs = newData.outputs.map(output => ({ ...output, value: null }));

    // set status to not evaluated
    newData.status = 'not evaluated';

    reactFlow.updateNodeData(id, newData as unknown as Partial<Record<string, unknown>>);

    if (autoExecute) {
      debouncedExecute();
    }
  }, [nodeData, autoExecute, reactFlow, debouncedExecute, id]);

  const renderInputComponent = (input: NodeInput) => {

    return <InputField 
      key={`${id}-input-${input.label}`}
      nodeId={id} 
      input={input} 
      onChange={updateNodeData}
    />

    // switch (input.type) {
    //   case 'image':
    //     return <ImageInputHandle key={`${id}-input-${input.label}`} {...commonProps} />;
    //   case 'float':
    //   case 'number':
    //   case 'int':
    //     return <NumberInputHandle key={`${id}-input-${input.label}`} {...commonProps} />;
    //   case 'string':
    //     return <TextInputHandle key={`${id}-input-${input.label}`} {...commonProps} />;
    //   default:
    //     return null;
    // }
  };

  const renderOutputComponent = (output: NodeOutput) => {

    return <OutputField
      key={`${id}-output-${output.label}`}
      nodeId={id} 
      output={output} 
      onChange={updateNodeData}
    />

    // switch (output.type) {
    //   case 'image':
    //     return <ImageOutputHandle key={`${id}-output-${output.label}`} {...commonProps} />;
    //   case 'number':
    //   case 'int':
    //     return <NumberOutputHandle key={`${id}-output-${output.label}`} {...commonProps} />;
    //   case 'string':
    //     return <TextOutputHandle key={`${id}-output-${output.label}`} {...commonProps} />;
    //   default:
    //     return null;
    // }
  };

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