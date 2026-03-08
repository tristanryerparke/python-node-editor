import { memo, useRef } from "react";
import NodeHeader from "./node-header";
import Inputs from "./node-inputs/inputs";
import Outputs from "./node-outputs/outputs";
import NodeDrawer from "./node-drawer";
import { Separator } from "../ui/separator";
import type { FrontendNodeData } from "../../types/types";
import InspectableFieldWrapper from "../inspector-sidebar/inspectable-field-wrapper";
import { useNodeData } from "@/stores/flowStore";
import { SyncedWidthHandleProvider } from "@/common/utility-components/synced-width-resizable";
import useFlowStore from "@/stores/flowStore";
import { cn } from "@/lib/utils";

export default memo(function CustomNode({
  data,
  id,
  selected,
}: {
  data: FrontendNodeData;
  id: string;
  selected?: boolean;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const path = [id];

  // Subscribe to _resizing to trigger re-renders when resizing occurs
  // This ensures the parent node recalculates its w-fit size during drag
  useNodeData([id, "_resizing"]);

  // Get node width from store using useNodeData
  const nodeWidth = (useNodeData([id, "_nodeWidth"]) as number | null) || null;

  const setNodeWidth = (width: number) => {
    void updateNodeData([id, "_nodeWidth"], width);
  };

  return (
    <div ref={nodeRef}>
      <SyncedWidthHandleProvider
        useTailwindScale={true}
        width={nodeWidth}
        maxWidth={250}
        setWidth={setNodeWidth}
      >
        <div
          className={cn(
            "min-w-min rounded-lg bg-card text-secondary-foreground transition-[color,box-shadow] !z-20",
            selected ? "ring-ring/50 ring-2" : "",
          )}
        >
          <div className="border border-input rounded-lg bg-background relative z-10">
            <InspectableFieldWrapper path={path}>
              <div>
                <NodeHeader data={data} nodeId={id} />
              </div>
            </InspectableFieldWrapper>
            <Separator />
            <Inputs arguments={data.arguments} path={[...path, "arguments"]} />
            <Separator />
            <Outputs outputs={data.outputs} path={path} />
          </div>
          {/*<div className="px-2">*/}
          <NodeDrawer
            isExpanded={data._terminal_drawer?._expanded ?? false}
            terminalOutput={
              (data as { terminalOutput?: string }).terminalOutput ?? ""
            }
            path={path}
          />
          {/*</div>*/}
        </div>
      </SyncedWidthHandleProvider>
    </div>
  );
});
