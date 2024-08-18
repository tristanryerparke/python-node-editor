import { Flex, Text, Divider, ActionIcon, TextInput, ScrollArea } from '@mantine/core';
import { IconReload, IconSearch } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

interface NodeData {
  id: number;
  name: string;
  type: string;
  position: { x: number; y: number };
  description: string;
  inputs: Record<string, { type: string; default: number }>;
  outputs: Record<string, any>;
  streaming: boolean;
}

function NodePicker() {
  const [nodeCategories, setNodeCategories] = useState<Record<string, NodeData[]>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNodes = () => {
    fetch('http://localhost:8000/all_nodes')
      .then((response) => response.json())
      .then((data) => {
        setNodeCategories(data);
        console.log('Fetched node data:', data);
      })
      .catch((error) => console.error('Error fetching node data:', error));
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, node: NodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredCategories = Object.entries(nodeCategories).reduce((acc, [category, nodes]) => {
    const filteredNodes = nodes.filter(node => node.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (category.toLowerCase().includes(searchTerm.toLowerCase()) || filteredNodes.length > 0) {
      acc[category] = filteredNodes;
    }
    return acc;
  }, {} as Record<string, NodeData[]>);

  return (
    <>
      <Flex align='center' justify='flex-start' w='15rem' direction='column'>
        <Flex direction='row' justify='flex-end' align='center' p='0.5rem' gap='0.25rem'>
          <TextInput
            leftSection={<IconSearch size={20} />}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
          <ActionIcon onClick={fetchNodes} size='lg' color='blue' variant='subtle' color='dark.3'>
            <IconReload size={20} />
          </ActionIcon>
        </Flex>
        <ScrollArea w='100%' h='100%'>
          {Object.entries(filteredCategories).map(([category, nodes]) => (
            <Flex key={category} direction='column' align='center' w='100%' p='0.5rem' gap='0'>
              <Text fw='bold'>{category}</Text>
              <Divider orientation='horizontal' color='dark.3' w='100%' mt='0.25rem' />
              {nodes.map((node, index) => (
                <Flex
                  key={index}
                  onDragStart={(event) => onDragStart(event, node)}
                  draggable
                  mt='xs'
                  w='100%'
                  h='4rem'
                  justify='center'
                  align='center'
                  bg='dark.5'
                  style={{ border: '1px solid var(--mantine-color-dark-3)', borderRadius: '0.25rem' }}
                >
                  {`${node.name.replace('Node', '')}`}
                </Flex>
              ))}
            </Flex>
          ))}
        </ScrollArea>
      </Flex>
      <div
        style={{ backgroundColor: 'var(--mantine-color-dark-2)', width: '0.075rem' }}
      />
    </>
  );
}

export default NodePicker;