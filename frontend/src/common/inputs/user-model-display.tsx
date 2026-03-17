import SingleLineTextDisplay from "../utility-components/single-line-text-display";

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
  const formatValue = () => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return typeName;
    }

    const fields = Object.entries(value)
      .map(([key, fieldValue]) => `${key}=${fieldValue}`)
      .join(", ");

    return `${typeName}(${fields})`;
  };

  return (
    <SingleLineTextDisplay
      content={formatValue()}
      dimmed={!value}
      disabled={disabled}
    />
  );
}
