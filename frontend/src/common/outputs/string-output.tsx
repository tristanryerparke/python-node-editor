import { memo, type NamedExoticComponent } from "react";
import SingleLineTextDisplay from "../utility-components/single-line-text-display";
import StringArea from "../utility-components/string-area";

const DEFAULT_HEIGHT = 30;

interface StringOutputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputData: any;
  path: (string | number)[];
}

type StringOutput = NamedExoticComponent<StringOutputProps> & {
  expandable: true;
};

const ExpandedStringOutput = memo(function ExpandedStringOutput({
  outputData,
  path,
}: StringOutputProps) {
  const value =
    typeof outputData?.value === "string" ? outputData.value : "";

  return (
    <StringArea
      value={value}
      editable={false}
      path={path}
      defaultHeight={DEFAULT_HEIGHT}
    />
  );
});

const StringOutputMain = memo(function StringOutput({
  outputData,
  path,
}: StringOutputProps) {
  const isExpanded = outputData?._expanded ?? false;

  if (isExpanded) {
    return <ExpandedStringOutput outputData={outputData} path={path} />;
  }

  return (
    <SingleLineTextDisplay
      content={outputData?.value ? String(outputData.value) : ""}
      dimmed={!outputData?.value}
    />
  );
}) as StringOutput;

StringOutputMain.expandable = true;

export default StringOutputMain as StringOutput;
