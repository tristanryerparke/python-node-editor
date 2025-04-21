import NodePicker from './components/nodePicker/NodePicker';
import { MantineProvider, createTheme } from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';

import '@mantine/core/styles.css';
import './index.css';
import '@xyflow/react/dist/style.css';
import NodeGraph from './components/nodeGraph/NodeGraph';
import ExecuteMenu from './components/ExecuteMenu';
import SaveButton from './components/SaveButton';

const theme = createTheme({
  primaryColor: 'dark',
});

function App() {

  return (
    <>
      <MantineProvider theme={theme}>
        <ReactFlowProvider>
          <div className="app-container">
            <div className="w-100 flex flex-col">
              <NodePicker />
              {/* buttons horizontal menu */}
              <div className="h-[1px] w-full bg-black"/>
              <div className='w-full flex flex-row p-1 gap-1'>
                
                <ExecuteMenu />
                <SaveButton />
              </div>
            </div>
            {/* vertical divider */}
            <div className="w-[1px] h-full bg-black"/>
            <NodeGraph />
          </div>
        </ReactFlowProvider>
      </MantineProvider>
    </>
  )
}

export default App
