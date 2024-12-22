import type { OutputDisplayProps } from "../OutputFieldDisplay";
import { OutputWrapper } from "../../../common/OutputWrapper";

export function TextOutput({ field, expanded }: OutputDisplayProps) {

  const formatPayload = (data: any) => {
    if (data === null) return '';

    return JSON.stringify(data, null, 4);
  };

  return (
    <OutputWrapper small={expanded}>
      {formatPayload(field.data)}
    </OutputWrapper>
  );
}