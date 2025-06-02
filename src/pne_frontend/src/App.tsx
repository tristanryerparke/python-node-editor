import NodePicker from './components/nodePicker/NodePicker';
import { MantineProvider, createTheme, NumberInput, TextInput, ActionIcon } from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import NodeGraph from './components/nodeGraph/NodeGraph';
import ExecuteMenu from './components/ExecuteMenu';
import SaveButton from './components/SaveButton';

const theme = createTheme({
  primaryColor: 'dark',

  components: {
    NumberInput: NumberInput.extend({
      classNames: {
        root: 'h-5 nodrag nopan nowheel',
        input: 'h-5 pl-1.5 border border-black rounded-md overflow-hidden',
        control: 'border-left border-black',
      },
    }),
    TextInput: TextInput.extend({
      classNames: {
        wrapper: 'h-5',
        input: 'h-5 min-h-5 border border-black rounded-md',
      },
    }),
    ActionIcon: ActionIcon.extend({
      classNames: {
        root: 'border border-black rounded-md',
      },
    }),
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
