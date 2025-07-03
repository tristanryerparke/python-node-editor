import { BaseNodeData } from "../../types/nodeTypes";
import { Button } from "@/components/ui/button";
import { Code, ArrowLeftRight } from "lucide-react";
import { NodeResizeControl } from "@xyflow/react";

type NodeHeaderProps = {
  data: BaseNodeData;
  nodeId?: string;
}

export default function NodeHeader({ data, nodeId }: NodeHeaderProps) {
  return (
    <div className="flex items-center py-1 px-2 w-full overflow-hidden">
      <span className="truncate overflow-hidden overflow-ellipsis text-sm font-bold">{data.display_name}</span>
      <div className="flex gap-0.5 justify-end items-center ml-auto">
        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
          <Code size={14} />
        </Button>
        <NodeResizeControl
          style={{all: 'unset', 
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            width: 'fit-content',
            height: 'fit-content'
          }}
          className="flex justify-center items-center w-fit h-fit"
          nodeId={nodeId}
          minWidth={data.min_width}
          maxWidth={data.max_width}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 cursor-ew-resize"
          >
            <ArrowLeftRight size={14} />
          </Button>
        </NodeResizeControl>
      </div>
    </div>
  );
}