import NodePicker from './components/nodePicker/NodePicker';
import { MantineProvider, createTheme } from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';

// import '@mantine/core/styles.css';
import '@xyflow/react/dist/style.css';
import NodeGraph from './components/nodeGraph/NodeGraph';
import ExecuteMenu from './components/ExecuteMenu';
import SaveButton from './components/SaveButton';

const theme = createTheme({
  primaryColor: 'dark',

  components: {
    NumberInput: {
      styles: {
        input: { border: '0.5px solid black', borderRadius: '5px' },
        control: { borderLeft: '0.5px solid black'},
      },
    },
  },
});

function App() {

  return (
    <>
      <MantineProvider theme={theme}>
        <ReactFlowProvider>
          <div className="app-container">
            <div className="min-w-50 flex flex-col">
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
