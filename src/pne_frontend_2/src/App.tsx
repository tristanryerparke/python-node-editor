import NodePicker from './components/nodepicker/NodePicker';
import { MantineProvider } from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';
import '@mantine/core/styles.css';
// import '@xyflow/react/dist/style.css';

function App() {

  return (
    <>
      <MantineProvider>
        <ReactFlowProvider>
          <div style={{height: '100%'}}>
            <div style={{
              width: 400, height: '100%', border: '1px solid black'}}>
              {/* <h1>PNE Frontend 2</h1> */}
              <NodePicker />
            </div>
          </div>
        </ReactFlowProvider>
      </MantineProvider>
    </>
  )
}

export default App
