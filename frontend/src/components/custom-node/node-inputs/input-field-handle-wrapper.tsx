import { Handle, Position } from "@xyflow/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import InputFieldDisplay from "./input-field-display";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import type { FrontendFieldDataWrapper } from "../../../types/types";
import InspectableFieldWrapper from "../../inspector-sidebar/inspectable-field-wrapper";

interface NodeInputFieldProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default function InputFieldHandleWrapper({
  fieldData,
  path,
}: NodeInputFieldProps) {
  // A Wrapper component for rendering an input field on a node with a handle and type tooltip

  const handleId = `${path.join(":")}:handle`;

  if (!fieldData) {
    return <div>No field data</div>;
  }

  const displayType = formatTypeForDisplay(fieldData.type);

  return (
    <InspectableFieldWrapper path={path}>
      <div className="relative items-center justify-center">
        <Handle
          // TODO: Why don't height and width work?
          className="p-1 rounded-full bg-primary"
          type="target"
          position={Position.Left}
          id={handleId}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            {/*The padding happens here*/}
            <div className="px-2 py-2">
              <InputFieldDisplay fieldData={fieldData} path={path} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={2}>
            <span className="text-xs">{displayType}</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </InspectableFieldWrapper>
  );
}
