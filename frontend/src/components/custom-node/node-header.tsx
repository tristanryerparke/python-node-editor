import type { FrontendNodeData } from "@/types/types";
import { memo, useCallback } from "react";
import NodeStatus from "./node-status";
import SourceCodeButton from "./source-code-button";
import useFlowStore from "@/stores/flowStore";

type NodeHeaderProps = {
  data: FrontendNodeData;
  nodeId: string;
};

export default memo(function NodeHeader({ data, nodeId }: NodeHeaderProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const terminalOutput =
    (data as { terminalOutput?: string }).terminalOutput ?? "";

  const handleToggleDrawer = useCallback(() => {
    const path = [nodeId, "_terminal_drawer", "_expanded"];
    updateNodeData(path, !data._terminal_drawer?._expanded);
  }, [nodeId, data._terminal_drawer?._expanded, updateNodeData]);

  if (!data) {
    return <div>No node data</div>;
  }

  return (
    <div className="h-fit flex items-center justify-between p-1 w-full">
      <span className="px-1 text-sm font-bold shrink-0">{data.name}</span>
      <div className="flex items-center gap-1">
        <SourceCodeButton filePath={data.filePath} />
        <NodeStatus
          status={data.status ?? "not-executed"}
          onToggleDrawer={handleToggleDrawer}
          hasTerminalOutput={!!terminalOutput}
          isDrawerOpen={data._terminal_drawer?._expanded ?? false}
        />
      </div>
    </div>
  );
});
