import { AnyData } from "../../types/dataTypes/anyData.ts";
import { ModelData as ModelDataType } from "../../types/dataTypes/modelData.ts";
import { ChevronButton } from "../ChevronButton.tsx";
import { updateNodeData, getNodeData } from "../../utils/updateNodeData.ts";

import './structured_data_styles.css';

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
    <div className={`pne-div structured-data-wrapper ${!expanded ? 'small' : ''}`}>
      <div className="structured-data-title">
        {modelData.class_name}({modelData.class_parent})
        <ChevronButton expanded={expanded} setExpanded={setExpanded} />
      </div>
      {expanded && (
        <div className="pne-div structured-data-list">
          {Object.entries(modelData)
            .filter(([key]) => key !== "class_name" && key !== "class_parent" && key !== "id" && key !== "metadata")
            .map(([key, value]) => {
              if (typeof value === "object") {
                return (
                  <div key={key} className="structured-data-item">
                    <div className="structured-data-label">{key}:</div>
                    {/* Add additional validation here too */}
                    {Array.isArray(path) ? 
                      renderData(value as AnyData, [...path, 'data', key]) : 
                      <div className="error-state">Invalid path</div>
                    }
                  </div>
                );
              }
              return null;
            })}
        </div>
      )}
    </div>
  );
};

export default ModelDataDisplay; 