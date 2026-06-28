import { useRef, useLayoutEffect, useState } from "react";
import {
  Editable,
  EditableArea,
  EditablePreview,
  EditableInput,
} from "../../../ui/editable";
import useFlowStore, { useNodeData } from "../../../../stores/flowStore";
import { cn } from "@/lib/utils";
import type { FrontendFieldDataWrapper } from "../../../../types/types";

interface EditableKeyProps {
  fieldName: string | number;
  path: (string | number)[];
}

export default function EditableKey({ fieldName, path }: EditableKeyProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [textWidth, setTextWidth] = useState<number | null>(null);
  const nodeId = path[0];
  const fieldNameString = String(fieldName);
  const [hasEmptyKeyError, setHasEmptyKeyError] = useState(false);

  // Get arguments from Zustand store
  const arguments_ = useNodeData([nodeId, "arguments"]) as
    | Record<string, FrontendFieldDataWrapper>
    | undefined;

  useLayoutEffect(() => {
    if (measureRef.current) {
      const width = measureRef.current.offsetWidth + 1;
      setTextWidth(width);
    }
  }, [fieldNameString]);

  const handleKeyChange = (newKey: string) => {
    if (!newKey) {
      setHasEmptyKeyError(true);
      return;
    }

    setHasEmptyKeyError(false);

    if (newKey === fieldNameString || !arguments_) return;

    if (arguments_[newKey]) {
      console.warn(`Key "${newKey}" already exists`);
      return;
    }

    const newArguments = { ...arguments_ };
    newArguments[newKey] = newArguments[fieldName];
    delete newArguments[fieldName];

    const argumentsPath = [nodeId, "arguments"];
    void updateNodeData(argumentsPath, newArguments);
  };

  return (
    <>
      <span
        ref={measureRef}
        className="invisible absolute border border-transparent px-1 py-0 shadow-xs text-base md:text-sm whitespace-nowrap"
        aria-hidden="true"
      >
        {fieldName}
      </span>
      <Editable
        value={fieldNameString}
        onValueChange={(newKey) => {
          if (newKey) setHasEmptyKeyError(false);
        }}
        onSubmit={handleKeyChange}
        placeholder={hasEmptyKeyError ? fieldNameString : "key"}
        invalid={hasEmptyKeyError}
        className="gap-0 shrink-0"
      >
        <EditableArea
          className={cn(
            "inline-block min-w-0 shrink-0 rounded-sm",
            hasEmptyKeyError && "ring-1 ring-destructive/30",
          )}
          style={textWidth ? { width: `${textWidth}px` } : undefined}
        >
          <EditablePreview
            className={cn(
              "border px-1 py-0 shadow-xs focus-visible:ring-0 text-base md:text-sm whitespace-nowrap",
              hasEmptyKeyError ? "border-destructive" : "border-transparent",
            )}
          />
          <EditableInput
            className={cn(
              "border px-1 py-0 w-full",
              hasEmptyKeyError && "border-destructive",
            )}
          />
        </EditableArea>
      </Editable>
    </>
  );
}
