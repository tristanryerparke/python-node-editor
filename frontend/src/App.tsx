import {
  MantineProvider,
  Flex
} from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';

import { useState, useEffect } from 'react';
import { PanelGroup } from 'react-resizable-panels';
import NodeGraph from './components/NodeGraph';
import Header from './components/Header';
import InspectorPanel from './components/InspectorPanel';
import NodePicker from './components/NodePicker';

import { PanelsContext } from './GlobalContext';

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

  return (
    <PanelsContext.Provider value={{ panels, setPanels }}>
      <MantineProvider defaultColorScheme="dark">
        <ReactFlowProvider>
          <Flex className="App">
            <Header />
            <PanelGroup direction="horizontal" autoSaveId="panel-width-save">
            
              {panels.showNodePicker && (<NodePicker />)}
              <NodeGraph />
              {panels.showInspector && (<InspectorPanel />)}

            </PanelGroup>
          </Flex>
        </ReactFlowProvider>
      </MantineProvider>
    </PanelsContext.Provider>
  );
}

export default App;