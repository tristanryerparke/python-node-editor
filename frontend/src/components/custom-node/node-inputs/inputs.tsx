import InputFieldHandleWrapper from "./input-field-handle-wrapper";
import { Separator } from "t-components/separator";
import AddListInput from "./dynamic/add-list-input";
import AddDictInput from "./dynamic/add-dict-input";
import { useNodeData } from "../../../stores/flowStore";
import type { FrontendFieldDataWrapper } from "../../../types/types";
import type { StructDescr } from "@/types/backend-schema";

interface InputsProps {
  arguments: Record<string, FrontendFieldDataWrapper>;
  path: (string | number)[];
}

export default function Inputs({ arguments: args, path }: InputsProps) {
  const nodeId = path[0];

  // Get dynamicInputType from Zustand store
  const dynamicInputType = useNodeData([nodeId, "dynamicInputType"]) as
    | StructDescr
    | null
    | undefined;

  // Sort arguments to maintain proper order:
  // 1. Named arguments (non-numeric) come first, in their original order
  // 2. Numbered arguments (from *args) come after, sorted numerically
  const sortedArguments = Object.entries(args || {}).sort(
    ([nameA], [nameB]) => {
      const isNumericA = /^\d+$/.test(nameA);
      const isNumericB = /^\d+$/.test(nameB);

      // If both are numeric, sort by number
      if (isNumericA && isNumericB) {
        return parseInt(nameA) - parseInt(nameB);
      }

      // Named arguments come before numeric ones
      if (!isNumericA && isNumericB) return -1;
      if (isNumericA && !isNumericB) return 1;

      // Both are named, maintain original order (stable sort)
      return 0;
    },
  );

  // Flag used for conditionally rendering the separator
  const hasExistingArguments = Object.keys(args || {}).length !== 0;

  return (
    <div className="flex flex-col">
      {sortedArguments.map(([argName, argData], index) => {
        return (
          <div key={argName} className="flex-1">
            {index > 0 && <Separator className="w-full border-input" />}
            <InputFieldHandleWrapper
              fieldData={argData}
              path={[...path, argName]}
            />
          </div>
        );
      })}
      {dynamicInputType?.structureType === "list" && (
        <>
          {hasExistingArguments && <Separator className="border-input" />}
          <AddListInput path={path} />
        </>
      )}
      {dynamicInputType?.structureType === "dict" && (
        <>
          {hasExistingArguments && <Separator className="border-input" />}
          <AddDictInput path={path} />
        </>
      )}
    </div>
  );
}
