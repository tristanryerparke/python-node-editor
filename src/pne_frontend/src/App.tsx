import NodePicker from './components/nodePicker/NodePicker';
import { MantineProvider, createTheme, NumberInput, TextInput, ActionIcon } from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';
import { Separator } from './components/ui/separator';


import NodeGraph from './components/nodeGraph/NodeGraph';
import ExecuteMenu from './components/execute-button';
import SaveButton from './components/save-button';

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
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <ReactFlowProvider>
            <div className="min-h-full flex h-screen w-screen flex-row overflow-hidden bg-background text-foreground">
              <div className="min-w-60 flex flex-col h-full">
                <NodePicker />
                <Separator className='mt-auto' />
                <div className='w-full flex flex-row p-2 gap-2'>
                  <ExecuteMenu />
                  <SaveButton />
                  <ModeToggle />
                </div>
              </div>
              <Separator orientation="vertical" />
              <NodeGraph />
            </div>
          </ReactFlowProvider>
        </ThemeProvider>
      </MantineProvider>
    </>
  )
}

export default App
