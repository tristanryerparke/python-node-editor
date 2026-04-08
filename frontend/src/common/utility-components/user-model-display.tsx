import { StringArea } from "./string-area";
import SingleLineTextDisplay from "./single-line-text-display";
import {
  formatExpandedUserModelValue,
  formatUserModelValue,
} from "@/utils/user-model-formatting";
import type { TypeSchema } from "@/types/backend-schema";

interface UserModelDisplayProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  disabled: boolean;
  expanded?: boolean;
  showEmptyTypeName?: boolean;
  typeName: string;
  typeSchema?: TypeSchema;
  rightButton?: React.ReactNode;
}

export default function UserModelDisplay({
  value,
  disabled,
  expanded = false,
  showEmptyTypeName = true,
  typeName,
  rightButton,
}: UserModelDisplayProps) {
  const hasValue = value != null;
  const RightButton = rightButton ? () => <>{rightButton}</> : undefined;

  if (expanded) {
    return (
      <StringArea
        value={hasValue || showEmptyTypeName ? formatExpandedUserModelValue(value, typeName) : ""}
        editable={false}
        disabled={disabled}
        dimmed={disabled}
      />
    );
  }

  return (
    <SingleLineTextDisplay
      content={hasValue || showEmptyTypeName ? formatUserModelValue(value, typeName) : ""}
      dimmed={!hasValue}
      disabled={disabled}
      rightButton={RightButton}
    />
  );
}
