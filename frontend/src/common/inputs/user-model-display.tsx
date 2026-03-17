import SingleLineTextDisplay from "../utility-components/single-line-text-display";
import { type TypeInfo } from "@/stores/typesStore";

interface UserModelDisplayProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputData: any;
  path: (string | number)[];
  disabled: boolean;
  typeInfo: TypeInfo;
}

export default function UserModelDisplay({
  inputData,
  disabled,
}: UserModelDisplayProps) {
  const formatValue = () => {
    if (!inputData?.value || typeof inputData.value !== "object") {
      return inputData?.type || "Unknown";
    }

    const typeName = inputData.type || "Object";
    const fields = Object.entries(inputData.value)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");

    return `${typeName}(${fields})`;
  };

  return (
    <SingleLineTextDisplay
      content={formatValue()}
      dimmed={!inputData?.value}
      disabled={disabled}
    />
  );
}
