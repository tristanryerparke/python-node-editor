import SingleLineTextDisplay from "../utility-components/single-line-text-display";
import { formatUserModelValue } from "@/utils/user-model-formatting";

interface UserModelDisplayProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  disabled: boolean;
  typeName: string;
}

export default function UserModelDisplay({
  value,
  disabled,
  typeName,
}: UserModelDisplayProps) {
  return (
    <SingleLineTextDisplay
      content={formatUserModelValue(value, typeName)}
      dimmed={!value}
      disabled={disabled}
    />
  );
}
