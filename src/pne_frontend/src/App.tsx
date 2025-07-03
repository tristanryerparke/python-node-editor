<<<<<<< Updated upstream
import NodePicker from './components/nodePicker/NodePicker';
import { MantineProvider, createTheme } from '@mantine/core';
=======
import NodePicker from './components/node-picker/node-picker';
>>>>>>> Stashed changes
import { ReactFlowProvider } from '@xyflow/react';
import '@mantine/core/styles.css';
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
          <div style={{height: '100%', display: 'flex', flexDirection: 'row'}}>
            <div style={{
              width: 400, 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              // padding: '10px'
            }}>
              {/* <h1>PNE Frontend 2</h1> */}
              <NodePicker />
              <div style={{height: '1px', width: '100%', backgroundColor: 'black'}}/>
              <div className='pne-div shrink' style={{padding: '0.25rem', gap: '0.25rem'}}>
                <ExecuteMenu />
                <SaveButton />
              </div>
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
