import {
  MantineProvider,
  Flex
} from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';

import { useState, useEffect } from 'react';
import { PanelGroup } from 'react-resizable-panels';
import NodeGraph from './components/NodeGraph';
import Header from './components/Header';
import Inspector from './components/inspector-elements/Inspector';
import NodePicker from './components/NodePicker';
import { AppContext, InspectorContext, FlowMetadataContext } from './GlobalContext';

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
  const [filename, setFilename] = useState<string>('Untitled');
  const [lastAutosaved, setLastAutosaved] = useState<Date | null>(null);


  return (
    <AppContext.Provider value={{ panels, setPanels, lastAutosaved, setLastAutosaved }}>
      <InspectorContext.Provider value={{
        isLocked, 
        setIsLocked, 
        lockedNodeId, 
        setLockedNodeId, 
        selectedNodeId, 
        setSelectedNodeId 
      }}>
        <FlowMetadataContext.Provider value={{ filename, setFilename }}>
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
        </FlowMetadataContext.Provider>
      </InspectorContext.Provider>
    </AppContext.Provider>
  );
}

export default App;