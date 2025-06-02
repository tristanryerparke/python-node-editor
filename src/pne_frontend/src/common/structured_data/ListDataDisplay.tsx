import { AnyData } from "../../types/dataTypes/anyData.ts";
import { ListData as ListDataType } from "../../types/dataTypes/listData.ts";
import { ChevronButton } from "../ChevronButton.tsx";
import { updateNodeData, getNodeData } from "../../utils/nodeDataUtils.ts";
import { JSX } from "react";


interface ListDataProps {
  path: (string | number)[];
  data: AnyData;
  renderData: (data: AnyData, path: (string | number)[]) => JSX.Element;
}

const ListDataDisplay = ({
  path,
  data,
  renderData,
}: ListDataProps): JSX.Element => {
  const listData = data as ListDataType;
  
  // Add validation for path
  if (!path || !Array.isArray(path)) {
    console.error("Invalid path received in ListDataDisplay:", path);
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
          <div className="text-sm flex-grow overflow-hidden text-ellipsis">List [{listData.payload.length}]</div>
          <ChevronButton expanded={expanded} setExpanded={setExpanded} />
        </div>
        {expanded && (
          <div className="w-full flex flex-col gap-2">
            {listData.payload.map((item, idx) => (
              <div key={idx} className="flex flex-row gap-1 items-center">
                <div className="text-sm flex-shrink text-ellipsis">{idx}:</div>
                {renderData(item as AnyData, [...path, 'payload', idx])}
              </div>
            ))}
          </div>
        )}
        </div>
    </div>
  );
};

export default ListDataDisplay; 