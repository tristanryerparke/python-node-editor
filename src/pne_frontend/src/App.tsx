import NodePicker from './components/nodePicker/NodePicker';
import { MantineProvider, createTheme } from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';
import '@mantine/core/styles.css';
import '@xyflow/react/dist/style.css';
import NodeGraph from './components/nodeGraph/NodeGraph';

const theme = createTheme({
  primaryColor: 'dark',
});

function App() {

  return (
    <>
      <MantineProvider theme={theme}>
        <ReactFlowProvider>
          <div style={{height: '100%', display: 'flex', flexDirection: 'row'}}>
            <div style={{
              width: 400, height: '100%'}}>
              {/* <h1>PNE Frontend 2</h1> */}
              <NodePicker />
            </div>
            <div style={{width: '1px', height: '100%', backgroundColor: 'black'}}/>
            <div style={{
              display: 'flex',
              width: '100%', height: '100%'}}>
              <NodeGraph />
            </div>
          </div>
        </ReactFlowProvider>
      </MantineProvider>
    </>
  )
}

export default App
