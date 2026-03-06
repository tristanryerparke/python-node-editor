import { Button } from "../../../ui/button";
import { Plus } from "lucide-react";
import useFlowStore, { useNodeData } from "../../../../stores/flowStore";
import type { FrontendFieldDataWrapper } from "../../../../types/types";
import type { StructDescr } from "@/types/backend-schema";

interface AddDictInputProps {
  path: (string | number)[];
}

export default function AddDictInput({ path }: AddDictInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const nodeId = path[0];

  // Get data from Zustand store
  const arguments_ = useNodeData([nodeId, "arguments"]) as
    | Record<string, FrontendFieldDataWrapper>
    | undefined;
  const dynamicInputType = useNodeData([nodeId, "dynamicInputType"]) as
    | StructDescr
    | null
    | undefined;

  const handleAddDictInput = () => {
    const argNames = Object.keys(arguments_ || {});
    const keyPattern = /^key_(\d+)$/;
    const keyNumbers = argNames
      .map((name) => {
        const match = name.match(keyPattern);
        return match ? parseInt(match[1]) : NaN;
      })
      .filter((num) => !isNaN(num));

    const nextNumber = keyNumbers.length > 0 ? Math.max(...keyNumbers) + 1 : 0;
    const newArgName = `key_${nextNumber}`;

    const newArg = {
      type: dynamicInputType?.itemsType || "str",
      _dynamicInputType: "dict" as const,
      value: null,
    };

    void updateNodeData([nodeId, "arguments", newArgName], newArg);
  };

  return (
    <div className="p-2 py-1.5 flex flex-row gap-2 items-center text-sm">
      <Button variant="ghost" size="icon-xs" onClick={handleAddDictInput}>
        <Plus />
      </Button>
      Add Key / Value Input
    </div>
  );
}
