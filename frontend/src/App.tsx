import {
  MantineProvider,
  Flex,
  ActionIcon
} from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';

import { useState, useEffect } from 'react';
import { PanelGroup } from 'react-resizable-panels';
import NodeGraph from './components/NodeGraph';
import Header from './components/Header';
import Inspector from './components/Inspector';
import NodePicker from './components/NodePicker';

import { PanelsContext, NodeSelectionContext, InspectorContext } from './GlobalContext';

// Styles
import '@mantine/core/styles.css';
import '@xyflow/react/dist/style.css';

function App() {

  const [panels, setPanels] = useState(() => {
    const savedPanelState = localStorage.getItem('panels');
    return savedPanelState ? JSON.parse(savedPanelState) : { showInspector: false, showNodePicker: true };
  });

  useEffect(() => {
    localStorage.setItem('panels', JSON.stringify(panels));
  }, [panels]);


  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [isLocked, setIsLocked] = useState(false);
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null);

  return (
    <PanelsContext.Provider value={{ panels, setPanels }}>
      <NodeSelectionContext.Provider value={{ selectedNodeId, setSelectedNodeId }}>
        <InspectorContext.Provider value={{ isLocked, setIsLocked, lockedNodeId, setLockedNodeId }}>
          <MantineProvider defaultColorScheme="dark">
            <ReactFlowProvider>
              <Flex className="App">
                <Header  />
                <PanelGroup direction="horizontal" autoSaveId="panel-width-save">
                
                  {panels.showNodePicker && (<NodePicker />)}
                  <NodeGraph />
                  {panels.showInspector && (
                    <Inspector>
                      <ActionIcon
                        onClick={() => setIsLocked(!isLocked)}
                        aria-label="Lock Inspector"
                        size="lg"
                        color={isLocked ? 'red' : 'green'}
                        variant="outline"
                      >
                        {isLocked ? '🔒' : '🔓'}
                      </ActionIcon>
                    </Inspector>
                  )}

                </PanelGroup>
              </Flex>
            </ReactFlowProvider>
          </MantineProvider>
        </InspectorContext.Provider>
      </NodeSelectionContext.Provider>
    </PanelsContext.Provider>
  );
}

export default App;