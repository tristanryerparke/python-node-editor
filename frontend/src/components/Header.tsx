import { useContext } from 'react';
import { Flex, Text, Group, ActionIcon, Button } from '@mantine/core';
import { IconLayoutSidebarFilled } from '@tabler/icons-react';
import { useNodes, useEdges } from '@xyflow/react';
import { PanelsContext } from '../GlobalContext';
import axios from 'axios';

function Header() {
  const { panels, setPanels } = useContext(PanelsContext);

  const toggleInspector = () => {
    setPanels(prevPanels => ({
      ...prevPanels,
      showInspector: !prevPanels.showInspector
    }));
  };

  const toggleNodePicker = () => {
    setPanels(prevPanels => ({
      ...prevPanels,
      showNodePicker: !prevPanels.showNodePicker
    }));
  };

  const nodes = useNodes();
  const edges = useEdges();

  const processNodes = (nodes) => {
    return nodes.map(({ data, measured, selected, dragging, position, type, ...rest }) => ({
      ...rest,
      ...data,
      inputs: Object.fromEntries(
        Object.entries(data.inputs).map(([key, input]) => [
          key,
          {
            type: input.type,
            default: input.default,
            value: input.value
          }
        ])
      )
    }));
  };

  const execute = async () => {
    const processedNodes = processNodes(nodes);
    const graph_def = { nodes: processedNodes, edges };

    try {
      console.log('GRAPH DEF', graph_def);
      const response = await axios.post('http://localhost:8000/execute', { graph_def });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data);
      } else {
        console.error('Error:', error);
      }
    }
  };

  return (
    <Flex 
      h='2.5rem' 
      justify='center' 
      align='center' 
      style={{borderBottom: '1px solid var(--mantine-color-dark-2)',}}
    >
      <Group justify='space-between' align='center' w='100%' px='0.35rem'>
        <ActionIcon color='dark.2'variant='subtle' onClick={toggleNodePicker}>
          <IconLayoutSidebarFilled />
        </ActionIcon>
        <Flex justify='center' align='center' gap='0.5rem'>
          {/* <Text align='center'>Header</Text> */}
          <Button 
            size='xs' 
            variant='outline' 
            color='green.4' 
            onClick={execute}
          >
            Execute
        </Button>

        </Flex>
        
        <ActionIcon color='dark.2' variant='subtle' onClick={toggleInspector}>
          <IconLayoutSidebarFilled rotate={180} />
        </ActionIcon>
      </Group>
    </Flex>
  );
}

export default Header;