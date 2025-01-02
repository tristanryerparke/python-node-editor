import { ActionIcon, TextInput } from '@mantine/core';
import { IconReload, IconSearch } from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

export interface BaseNode {
  id: string;
  position: { x: number; y: number };
  data: BaseNodeData;
  group: string;
}

export type NodeCategories = Record<string, BaseNode[] & { groups?: Record<string, BaseNode[]> }>;

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
      <div style={{
        flexDirection: 'column', 
        minWidth: '175px', 
        overflowX: 'scroll',
        overflowY: 'hidden'
      }}>
        <div style={{
          flexDirection: 'row', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          gap: '0.5rem',
          height: 'auto',
          padding: '0.25rem',
        }}>
          <TextInput
            // margin='1rem'
            leftSection={<IconSearch size={20} />}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
          <ActionIcon onClick={fetchNodes} size='lg' variant='subtle' color='dark.3'>
            <IconReload size={20} />
          </ActionIcon>
        </div>
        <hr style={{margin: '0'}}/>
        <div style={{
          overflowY: 'scroll',
          justifyContent: 'flex-start', 
          alignItems: 'flex-start',
          paddingBottom: '0.25rem'
        }}>
          {Object.entries(filteredCategories).map(([category, categoryData], index) => (
            <div key={category}>
              {index > 0 && <hr style={{marginTop: '0.25rem'}}/>}
              <div className='shrink' style={{padding: '0 0.25rem 0 0.25rem'}}><b>{category}</b></div>
              {categoryData.groups && Object.entries(categoryData.groups).map(([group, nodes]) => (
                <div key={`${category}-${group}`} style={{gap: '0.25rem'}}>
                  <div style={{padding: '0 0.25rem 0 0.25rem'}}><i>{group}</i></div>
                  <div style={{padding: '0 0.25rem 0 0.25rem', gap: '0.25rem'}}>
                    {nodes.map((node, index) => (
                      <div
                        key={index}
                        onDragStart={(event) => onDragStart(event, node)}
                        draggable
                        style={{ 
                          width: '100%',
                          borderRadius: '0.25rem',
                          border: '1px solid black',
                          alignItems: 'flex-start',
                          padding: '0.25rem',
                          zIndex: 1000,
                          opacity: 1
                        }}
                      >
                        {`${node.data.display_name}`}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default NodePicker;