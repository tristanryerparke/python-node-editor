import { Handle, Position, useNodeConnections } from "@xyflow/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import InputFieldDisplay from "@/common/inputs/input-field-display";
import InputMenu from "./input-menu";
import EditableKey from "./dynamic/editable-key";
import { useNodeData } from "../../../stores/flowStore";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import type { FrontendFieldDataWrapper } from "../../../types/types";
import type { StructDescr } from "@/types/backend-schema";
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
  const connections = useNodeConnections({
    handleType: "target",
    handleId,
  });
  const edgeConnected = connections.some(
    (connection) => connection.targetHandle === handleId,
  );
  const disabled = edgeConnected;

  // Dynamic dict inputs have editable field names on the canvas
  const nodeId = path[0];
  const dynamicInputType = useNodeData([nodeId, "dynamicInputType"]) as
    | StructDescr
    | null
    | undefined;
  const isDynamicDictInput =
    fieldData?._dynamicInputType === "dict" &&
    dynamicInputType?.structureType === "dict";

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
              <InputFieldDisplay
                fieldData={fieldData}
                path={path}
                disabled={disabled}
                edgeConnected={edgeConnected}
                className="gap-2"
                menu={<InputMenu path={path} fieldData={fieldData} />}
                renderFieldName={
                  isDynamicDictInput
                    ? (fieldName) => (
                        <EditableKey fieldName={fieldName} path={path} />
                      )
                    : undefined
                }
              />
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
