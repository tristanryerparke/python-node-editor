import "./index.css";
import "@xyflow/react/dist/style.css";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect } from "react";
import useSWR from "swr";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

import { Separator } from "./components/ui/separator";

import { ThemeProvider } from "./components/theme-provider";

import Inspector from "./components/inspector-sidebar/inspector";
import NodeGraph from "./components/node-graph";
import usePanelsStore from "./stores/panelsStore";
import NodesTypesSidebar from "./components/node-types-sidebar/nodes-types-sidebar";
import { fetcher } from "./lib/fetcher";
import useNodeSchemas from "./hooks/useNodeSchemas";
import useTypesStore, { type TypeInfo } from "./stores/typesStore";

function App() {
  const { showInspector, showNodePicker } = usePanelsStore();
  const setTypes = useTypesStore((state) => state.setTypes);
  const { data: typesData } = useSWR("/types", fetcher);

  useNodeSchemas();

  useEffect(() => {
    if (typesData) {
      setTypes(typesData as Record<string, TypeInfo>);
    }
  }, [setTypes, typesData]);

  return (
    <>
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
    </>
  );
}

export default App;
