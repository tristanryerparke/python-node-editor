import { Flex, Text, Divider, ActionIcon, TextInput, ScrollArea, Tooltip } from '@mantine/core';
import { IconReload, IconSearch } from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { BaseNode, NodeCategories } from '../types/DataTypes';
import { useReactFlow } from '@xyflow/react';

function NodePicker() {
  const { getNodes, setNodes, setEdges } = useReactFlow();
  const [nodeCategories, setNodeCategories] = useState<NodeCategories>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNodes = useCallback(() => {
    fetch('http://localhost:8000/all_nodes')
      .then((response) => response.json())
      .then((data: NodeCategories) => {
        setNodeCategories(data);
        console.log('Fetched node data:', data);

        // Create a set of valid node types
        const validNodeTypes = new Set(
          Object.values(data).flatMap(nodes => nodes.map(node => node.data.class_name))
        );

        // Filter out nodes that are no longer valid
        setNodes(nodes => nodes.filter(node => validNodeTypes.has(node.data.class_name as string)));

        // Remove edges connected to deleted nodes
        setEdges(edges => edges.filter(edge => 
          getNodes().some(node => node.id === edge.source) &&
          getNodes().some(node => node.id === edge.target)
        ));
      })
      .catch((error) => console.error('Error fetching node data:', error));
  }, [setNodeCategories, setNodes, setEdges, getNodes]);

  useEffect(() => {
    fetchNodes();
  }, []);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, node: BaseNode) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredCategories = Object.entries(nodeCategories).reduce((acc, [category, nodes]) => {
    // Group nodes by their group attribute
    const groupedNodes = nodes.reduce((groups: Record<string, BaseNode[]>, node) => {
      const group = node.group || 'Ungrouped';  // Default to 'Ungrouped' if no group specified
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(node);
      return groups;
    }, {});

    // Filter nodes based on search term
    const filteredGroups: Record<string, BaseNode[]> = {};
    Object.entries(groupedNodes).forEach(([group, groupNodes]) => {
      const filteredNodes = groupNodes.filter(node => 
        node.data.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredNodes.length > 0) {
        filteredGroups[group] = filteredNodes;
      }
    });

    if (Object.keys(filteredGroups).length > 0 || category.toLowerCase().includes(searchTerm.toLowerCase())) {
      acc[category] = nodes.filter(node => 
        node.data.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      acc[category].groups = filteredGroups;  // Attach groups to the category
    }
    return acc;
  }, {} as NodeCategories & { [key: string]: { groups?: Record<string, BaseNode[]> } });

  return (
    <>
      <Flex align='center' justify='flex-start' w='15rem' direction='column' p={0} m={0}>
        <Flex direction='row' justify='flex-end' align='center' p='0.5rem' gap='0.25rem'>
          <TextInput
            leftSection={<IconSearch size={20} />}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
          <ActionIcon onClick={fetchNodes} size='lg' variant='subtle' color='dark.3'>
            <IconReload size={20} />
          </ActionIcon>
        </Flex>
        <ScrollArea w='100%' h='100%' p={0} m={0}>
          {Object.entries(filteredCategories).map(([category, categoryData]) => (
            <Flex key={category} direction='column' align='center' w='100%' p={0} gap='0'>
              <Divider orientation='horizontal' color='dark.3' w='100%' mb='0.25rem' />
              <Text fw='bold'>{category}</Text>
              {categoryData.groups && Object.entries(categoryData.groups).map(([group, nodes]) => (
                <Flex key={`${category}-${group}`} direction='column' align='center' w='100%' p={0} gap='0'>
                  <Text size='sm' c='dimmed'>{group}</Text>
                  <Flex direction='column' align='center' w='100%' px='0.5rem' pb='0.5rem' pt='0.25rem' m={0} gap='0.25rem'>
                    {nodes.map((node, index) => (
                      <Tooltip
                        key={index}
                        label={node.data.description || 'No Description'}
                        color='dark.3'
                        withArrow
                        arrowSize={8}
                        multiline
                        w={200}
                        position="right"
                      >
                        <Flex
                          onDragStart={(event) => onDragStart(event, node)}
                          draggable
                          w='100%'
                          h='2rem'
                          justify='center'
                          align='center'
                          bg='dark.5'
                          style={{ border: '1px solid var(--mantine-color-dark-3)', borderRadius: '0.25rem' }}
                        >
                          <Text size='sm' fw={700}>{`${node.data.display_name}`}</Text>
                        </Flex>
                      </Tooltip>
                    ))}
                  </Flex>
                </Flex>
              ))}
            </Flex>
          ))}
        </ScrollArea>
      </Flex>
      <div style={{ backgroundColor: 'var(--mantine-color-dark-2)', width: '0.075rem' }} />
    </>
  );
}

export default NodePicker;