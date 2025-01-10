import { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { NodeCategories, BaseNode } from '../../types/nodeTypes';
import { SearchBar } from './SearchBar';
import { CategoryGroup } from './CategoryGroup';


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
  }, [fetchNodes]);

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
    <div className='pne-div' style={{
      minWidth: '175px', 
      overflowX: 'scroll',
      overflowY: 'hidden'
    }}>
      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchNodes}
      />
      <hr style={{margin: '0'}}/>
      <div className='pne-div' style={{
        overflowY: 'scroll',
        justifyContent: 'flex-start', 
        alignItems: 'flex-start',
        paddingBottom: '0.25rem'
      }}>
        {Object.entries(filteredCategories).map(([category, categoryData], index) => (
          <CategoryGroup 
            key={category}
            category={category}
            categoryData={categoryData}
            showDivider={index > 0}
          />
        ))}
      </div>
    </div>
  );
}

export default NodePicker;