import { Button } from "../../../ui/button";
import { Plus } from "lucide-react";
import useFlowStore, { useNodeData } from "../../../../stores/flowStore";
import type { FrontendFieldDataWrapper } from "../../../../types/types";
import type { StructDescr } from "@/types/backend-schema";

interface AddListInputProps {
  path: (string | number)[];
}

export default function AddListInput({ path }: AddListInputProps) {
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

  const handleAddNumberedInput = () => {
    const argNames = Object.keys(arguments_ || {});
    const argNumbers = argNames
      .map((name) => {
        if (/^\d+$/.test(name)) {
          return parseInt(name);
        } else if (name.startsWith("_") && /^\d+$/.test(name.substring(1))) {
          return parseInt(name.substring(1));
        }
        return NaN;
      })
      .filter((num) => !isNaN(num));

    const nextNumber = argNumbers.length > 0 ? Math.max(...argNumbers) + 1 : 0;
    const newArgName = `${nextNumber}`;

    const newArg = {
      type:
        dynamicInputType?.itemsType ||
        (arguments_ && argNames[0] ? arguments_[argNames[0]].type : "str"),
      _dynamicInputType: "list" as const,
      value: null,
    };

    void updateNodeData([nodeId, "arguments", newArgName], newArg);
  };

  return (
    <div className="p-2 py-1.5 flex flex-row gap-2 items-center">
      <Button variant="ghost" size="icon-xs" onClick={handleAddNumberedInput}>
        <Plus />
      </Button>
      Add Input
    </div>
  );
}
