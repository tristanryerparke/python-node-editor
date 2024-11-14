import type { OutputDisplayProps } from "../OutputFieldDisplay";
import { formatClassString } from "../../../utils/classFormatter";
import { OutputWrapper } from "../../../common/OutputWrapper";

export function TextOutput({ field, expanded }: OutputDisplayProps) {

  const formatPayload = (data: any) => {
    if (data === null) return '';
    if (typeof data.payload === 'object') {
      return formatClassString(JSON.stringify(data.payload));
    }
    return data.payload;
  };

  return (
    <OutputWrapper small={expanded}>
      {formatPayload(field.data)}
    </OutputWrapper>
  );
}