import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "t-components/dropdown-menu";
import useFlowStore from "@/stores/flowStore";
import type { FrontendFieldDataWrapper } from "@/types/types";

interface UnionTypeMenuItemsProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
  onSelect?: () => void;
}

export default function UnionTypeMenuItems({
  fieldData,
  path,
  onSelect,
}: UnionTypeMenuItemsProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  if (
    typeof fieldData.type !== "object" ||
    !("anyOf" in fieldData.type) ||
    !fieldData.type.anyOf
  ) {
    return null;
  }

  const unionTypes = fieldData.type.anyOf;
  if (unionTypes.length <= 1) return null;

  const selectedType = fieldData._selectedType || unionTypes[0];

  return (
    <>
      <DropdownMenuLabel>Input Type</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup
        value={selectedType}
        onValueChange={(newType) => {
          void updateNodeData([...path, "_selectedType"], newType);
          onSelect?.();
        }}
      >
        {unionTypes.map((type: string) => (
          <DropdownMenuRadioItem key={type} value={type}>
            {type}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}
