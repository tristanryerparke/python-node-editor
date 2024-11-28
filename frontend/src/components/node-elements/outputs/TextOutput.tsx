import type { OutputDisplayProps } from "../OutputFieldDisplay";
import { formatClassString } from "../../../utils/classFormatter";
import { OutputWrapper } from "../../../common/OutputWrapper";

export function TextOutput({ field, expanded }: OutputDisplayProps) {

  const formatPayload = (data: any) => {
    if (data === null) return '';
    
    // If payload is null but we have a preview, use the preview
    if (data.payload === null && data.metadata?.preview) {
      return data.metadata.preview;
    }
  
    
    return data.payload;
  };

  return (
    <OutputWrapper small={expanded}>
      {formatPayload(field.data)}
    </OutputWrapper>
  );
}