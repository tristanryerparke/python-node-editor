import "./index.css";
import "@xyflow/react/dist/style.css";
import { QueryClientProvider } from "@tanstack/react-query";

import { ReactFlowProvider } from "@xyflow/react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

import { Separator } from "./components/ui/separator";

import { ThemeProvider } from "./components/theme-provider";

import Inspector from "./components/inspector-sidebar/inspector";
import NodeGraph from "./components/node-graph";
import { useEffect } from "react";
import useTypesStore from "./stores/typesStore";
import useSchemasStore from "./stores/schemasStore";
import usePanelsStore from "./stores/panelsStore";
import NodesTypesSidebar from "./components/node-types-sidebar/nodes-types-sidebar";
import { queryClient } from "./lib/query-client";

function App() {
  const fetchTypes = useTypesStore((state) => state.fetchTypes);
  const fetchNodeSchemas = useSchemasStore((state) => state.fetchNodeSchemas);
  const { showInspector, showNodePicker } = usePanelsStore();

  useEffect(() => {
    fetchTypes();
    fetchNodeSchemas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <ReactFlowProvider>
            <div className="min-h-full flex h-screen w-screen flex-row overflow-hidden bg-background text-foreground">
              {showNodePicker && (
                <>
                  <NodesTypesSidebar />
                  <Separator orientation="vertical" />
                </>
              )}
              <ResizablePanelGroup
                direction="horizontal"
                autoSaveId="panel-width-save"
              >
                <ResizablePanel id="node-graph" order={1}>
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
                      className="min-w-60 max-w-[800px]"
                    >
                      <Inspector />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </div>
          </ReactFlowProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
