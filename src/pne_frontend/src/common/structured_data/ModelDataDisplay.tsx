import { AnyData } from "../../types/dataTypes/anyData.ts";
import { ModelData as ModelDataType } from "../../types/dataTypes/modelData.ts";
import { ChevronButton } from "../ChevronButton.tsx";
import { updateNodeData, getNodeData } from "../../utils/nodeDataUtils.ts";
import { JSX } from "react";


interface ModelDataProps {
  data: AnyData;
  path: (string | number)[];
  renderData: (data: AnyData, path: (string | number)[]) => JSX.Element;
}

const ModelDataDisplay = ({
  data,
  path,
  renderData,
}: ModelDataProps): JSX.Element => {
  const modelData = data as ModelDataType;
  
  // Add validation for path
  if (!path || !Array.isArray(path)) {
    console.error("Invalid path received in ModelDataDisplay:", path);
    // Return a fallback UI when path is invalid
    return <div className="error-state">Invalid path data</div>;
  }
  
  // Now safely use path since we've validated it
  const expandedData = getNodeData([...path, 'metadata', 'expanded']);
  const expanded = (expandedData ?? false) as boolean;
  const setExpanded = (expanded: boolean) => {
    updateNodeData({ path: [...path, 'metadata', 'expanded'], newData: expanded });
  };

  return (
    <div
      className={
        expanded ? 
        "w-full rounded-md transition-colors duration-500 overflow-hidden" : 
        "w-full rounded-md transition-colors duration-500 dark:bg-input/30 overflow-hidden"
      }
    >
      <div className="w-full flex flex-col justify-center border-input border-1 p-2 gap-2 overflow-hidden">
        <div className="w-full flex flex-row gap-1 items-center justify-between">
          <div className="truncate flex-shrink overflow-hidden text-sm">
            {modelData.class_name}({modelData.class_parent})
          </div>
          <ChevronButton expanded={expanded} setExpanded={setExpanded} />
        </div>
        {expanded && (
          <div className="flex flex-col gap-2">
            {Object.entries(modelData)
              .filter(
                ([key]) =>
                  key !== "class_name" &&
                  key !== "class_parent" &&
                  key !== "id" &&
                  key !== "metadata"
              )
              .map(([key, value]) => {
                if (typeof value === "object") {
                  return (
                    <div key={key} className="flex flex-row gap-1 items-center">
                      <div className="text-sm flex-shrink text-ellipsis">{key}:</div>
                      {Array.isArray(path) ? (
                        renderData(value as AnyData, [...path, "data", key])
                      ) : (
                        <div className="error-state">Invalid path</div>
                      )}
                    </div>
                  );
                }
                return null;
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelDataDisplay; 