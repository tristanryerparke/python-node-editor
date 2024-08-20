import { memo, useCallback, useContext } from 'react';
import { Node, NodeProps, useNodesData } from '@xyflow/react';
import { Paper, Divider, Flex } from '@mantine/core';
import { TextInputHandle, TextOutputHandle } from './node-elements/TextHandles';
import { NumberInputHandle, NumberOutputHandle } from './node-elements/NumberHandles';

import NodeTopBar from './node-elements/NodeTopBar';
import { NodeSelectionContext, AutoExecuteContext } from '../GlobalContext';
import { useExecutionManager } from '../hooks/useExecutionManager';

import { BaseNodeData, NodeInput, NodeOutput } from '../types/DataTypes';

type CustomNodeData = Node<BaseNodeData & Record<string, unknown>>;

export default memo(function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
  // const reactFlow = useReactFlow();
  const { autoExecute } = useContext(AutoExecuteContext);
  const { debouncedExecute } = useExecutionManager();
  // const edges = useEdges();

  const nodeData = useNodesData(id)?.data as unknown as BaseNodeData;

  const updateNodeData = useCallback((inputKey: string, value: any) => {

    // console.log('got an update')

    nodeData.inputs[inputKey].value = value;

    // console.log('nodeData after', nodeData);

    if (autoExecute) {
      debouncedExecute();
    }
  }, [nodeData, debouncedExecute, autoExecute]);

  const renderInputComponent = (key: string, input: NodeInput) => {
    const commonProps = {
      handleId: `${id}-input-${key}`,
      label: key,
      value: input.value ?? '',
      onChange: (value: any) => updateNodeData(key, value),
      type: input.type
    };

    switch (input.type) {
      case 'float':
      case 'number':
      case 'int':
        return <NumberInputHandle key={`${id}-input-${key}`} {...commonProps} />;
      case 'str':
        return <TextInputHandle key={`${id}-input-${key}`} {...commonProps} />;
      default:
        return null;
    }
  };

  const renderOutputComponent = (key: string, output: NodeOutput) => {
    const commonProps = {
      handleId: `${id}-output-${key}`,
      label: key,
      value: output.value ?? '',
      type: output.type
    };

    switch (output.type) {
      case 'number':
      case 'int':
        return <NumberOutputHandle key={`${id}-output-${key}`} {...commonProps} />;
      case 'str':
        return <TextOutputHandle key={`${id}-output-${key}`} {...commonProps} />;
      default:
        return null;
    }
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

      <Flex direction='column' gap='0.5rem' p='0.5rem' w='100%'>
        {Object.entries(data.inputs).map(([key, input]) => renderInputComponent(key, input))}
      </Flex>

      <Divider orientation='horizontal' color='dark.3' w='100%'/>

      <Flex direction='column' gap='0.5rem' p='0.5rem' w='100%'>
        {Object.entries(data.outputs).map(([key, output]) => 
          !(data.streaming && key === 'status') && renderOutputComponent(key, output)
        )}
      </Flex>
    </Paper>
  );
});