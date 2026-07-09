import "./index.css";
import "@xyflow/react/dist/style.css";
import { ReactFlowProvider } from "@xyflow/react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

import { Separator } from "t-components/separator";

import { ThemeProvider } from "./components/theme-provider";

import Inspector from "./components/inspector-sidebar/inspector";
import NodeGraph from "./components/node-graph";
import GraphToolbar from "./components/graph-toolbar/graph-toolbar";
import usePanelsStore from "./stores/panelsStore";
import NodesTypesSidebar from "./components/node-types-sidebar/nodes-types-sidebar";
import useEnvironment from "./hooks/useEnvironment";
import { EnvironmentMismatchDialog } from "./common/utility-components/environment-mismatch-dialog";
import { Toaster } from "./components/ui/sonner";

function App() {
  const { showInspector, showNodePicker } = usePanelsStore();
  const { isPending, error } = useEnvironment();

  if (error) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex h-screen w-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-xl rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
            Cannot connect to backend, failed to load environment
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (isPending) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Loading environment...
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ReactFlowProvider>
        <div className="relative min-h-full flex h-screen w-screen flex-row overflow-hidden bg-background text-foreground isolate">
          <GraphToolbar />
          {showNodePicker && (
            <div className="relative z-0 flex h-full shrink-0">
              <NodesTypesSidebar />
              <Separator orientation="vertical" />
            </div>
          )}
          <ResizablePanelGroup
            direction="horizontal"
            autoSaveId="panel-width-save"
          >
            <ResizablePanel
              id="node-graph"
              order={1}
              className="relative z-30 overflow-visible"
            >
              <NodeGraph />
            </ResizablePanel>
            {showInspector && (
              <>
                <ResizableHandle />
                <ResizablePanel
                  id="inspector"
                  order={2}
                  defaultSize={25}
                  minSize={15}
                  maxSize={75}
                  className="relative z-0 min-w-60 max-w-[800px]"
                >
                  <Inspector />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
          <EnvironmentMismatchDialog />
          <Toaster />
        </div>
      </ReactFlowProvider>
    </ThemeProvider>
  );
}

export default App;
