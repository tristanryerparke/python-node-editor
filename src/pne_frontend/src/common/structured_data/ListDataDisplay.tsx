import { AnyData } from "../../types/dataTypes/anyData.ts";
import { ListData as ListDataType } from "../../types/dataTypes/listData.ts";
import { ChevronButton } from "../ChevronButton.tsx";
import { updateNodeData, getNodeData } from "../../utils/nodeDataUtils.ts";

import './structured_data_styles.css';

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
    <div className={`pne-div  structured-data-wrapper ${!expanded ? 'small' : ''}`}>
      <div className="structured-data-title">
        List [{listData.payload.length}]
        <ChevronButton expanded={expanded} setExpanded={setExpanded} />
      </div>
      {expanded && (
        <div className="pne-div structured-data-list">
          {listData.payload.map((item, idx) => (
            <div key={idx} className="structured-data-item">
              <div className="structured-data-label">{idx}:</div>
              {renderData(item as AnyData, [...path, 'data', 'payload', idx])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListDataDisplay; 