import { Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Flex, Text, Title, Box, Badge, useMantineTheme } from '@mantine/core'  
import { useContext } from 'react';
import { NodeSelectionContext } from '../GlobalContext';
import { useNodes } from '@xyflow/react';

function InspectorPanel() {
  const { selectedNodeId } = useContext(NodeSelectionContext);
  const nodes = useNodes();
  const theme = useMantineTheme();

  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.orange[5];
      case 'executing':
        return theme.colors.blue[5];
      case 'streaming':
        return theme.colors.indigo[5];
      case 'evaluated':
        return theme.colors.green[5];
      default:
        return theme.colors.gray[5];
    }
  };

  const renderInputs = (inputs) => (
    <Box>
      <Title order={4}>Inputs:</Title>
      {Object.entries(inputs).map(([key, value]) => (
        <Text key={key}>{key}: {value.value} (Type: {value.type}, Default: {value.default})</Text>
      ))}
    </Box>
  );

  const renderOutputs = (outputs) => (
    <Box mt="md">
      <Title order={4}>Outputs:</Title>
      {Object.entries(outputs).map(([key, value]) => (
        <Text key={key}>{key}: {value === null ? 'none' : value}</Text>
      ))}
    </Box>
  );

  return (
    <>
    <PanelResizeHandle style={{ backgroundColor: 'var(--mantine-color-dark-2)', width: '0.075rem' }} />
    <Panel 
      id="inspector" 
      order={2} 
      defaultSize={25}
      maxSize={75}
      minSize={20}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <Flex direction="column" h='100%' w='100%' p='1rem'>
        {selectedNode ? (
          <>
            <Flex direction="row" w="100%" justify="space-between">
              <Title order={3} mb="md">{`Node: ${selectedNode.data.name.replace('Node', '')}`}</Title>
              <Flex direction="column" justify="flex-end" align="flex-end">
                <Badge variant='outline' color={getStatusColor(selectedNode.data.status)}>
                  {selectedNode.data.status}
                </Badge>
                <Text size="xs" mb="md">{`ID: ${selectedNode.id}`}</Text>
              </Flex>
            </Flex>
            
            {renderInputs(selectedNode.data.inputs)}
            {renderOutputs(selectedNode.data.outputs)}
          </>
        ) : (
          <Title order={3}>No node selected</Title>
        )}
      </Flex>
    </Panel>
    </>
  );
}

export default InspectorPanel;