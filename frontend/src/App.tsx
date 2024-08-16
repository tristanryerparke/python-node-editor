import {
  MantineProvider,
  Flex
} from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';

import { useState, useEffect } from 'react';
import { PanelGroup } from 'react-resizable-panels';
import NodeGraph from './components/NodeGraph';
import Header from './components/Header';
import Inspector from './components/Inspector';
import NodePicker from './components/NodePicker';

import { PanelsContext, NodeSelectionContext } from './GlobalContext';

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


  return (
    <PanelsContext.Provider value={{ panels, setPanels }}>
      <NodeSelectionContext.Provider value={{ selectedNodeId, setSelectedNodeId }}>
        <MantineProvider defaultColorScheme="dark">
          <ReactFlowProvider>
            <Flex className="App">
              <Header  />
              <PanelGroup direction="horizontal" autoSaveId="panel-width-save">
              
                {panels.showNodePicker && (<NodePicker />)}
                <NodeGraph />
                {panels.showInspector && (<Inspector />)}

              </PanelGroup>
            </Flex>
          </ReactFlowProvider>
        </MantineProvider>
      </NodeSelectionContext.Provider>
    </PanelsContext.Provider>
  );
}

export default App;