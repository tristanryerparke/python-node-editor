import { Tabs, TabsContent, TabsList, TabsTrigger } from "t-components/tabs";
import NodePicker from "./node-picker/node-picker";
import TypesBrowser from "./types-browser/types-browser";

export default function NodesTypesSidebar() {
  return (
    <div className="w-60 min-w-60 max-w-60 shrink-0 flex flex-col h-full overflow-hidden">
      <Tabs
        defaultValue="nodes"
        className="w-full gap-0 flex flex-col flex-1 overflow-hidden"
      >
        <div className="flex flex-row w-full px-2 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="nodes" className="flex-1 overflow-hidden">
          <NodePicker />
        </TabsContent>
        <TabsContent value="types" className="flex-1 overflow-hidden">
          <TypesBrowser />
        </TabsContent>
      </Tabs>
    </div>
  );
}
