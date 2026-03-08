import OutputFieldHandleWrapper from "./output-field-handle-wrapper";
import { Separator } from "../../ui/separator";
import type { FrontendFieldDataWrapper } from "../../../types/types";

interface OutputsProps {
  outputs: Record<string, FrontendFieldDataWrapper>;
  path: (string | number)[];
}

export default function Outputs({ outputs, path }: OutputsProps) {
  return (
    <div className="flex flex-col">
      {Object.entries(outputs).map(
        (
          [outputName, outputDef]: [string, FrontendFieldDataWrapper],
          index,
        ) => (
          <div key={outputName} className="flex-1">
            {index > 0 && <Separator className="w-full" />}
            <OutputFieldHandleWrapper
              fieldData={outputDef}
              path={[...path, "outputs", outputName]}
            />
          </div>
        ),
      )}
    </div>
  );
}
