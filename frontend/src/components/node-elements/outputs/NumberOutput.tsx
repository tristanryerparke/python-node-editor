import type { OutputDisplayProps } from "../OutputFieldDisplay";
import { OutputWrapper } from "../../../common/OutputWrapper";

export function NumberOutput({ field, expanded }: OutputDisplayProps) {
  const roundToThreeDecimals = (num: number) => {
    return Math.round(num * 1000) / 1000;
  };
  
  const formattedValue = field.data === null 
    ? '' 
    : typeof field.data.payload === 'number' 
      ? roundToThreeDecimals(field.data.payload) 
      : field.data.payload;
  
  return (
    <OutputWrapper small={!expanded}>
      {formattedValue}
    </OutputWrapper>
  );
} 