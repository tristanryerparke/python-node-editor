import { AnyData } from "../types/dataTypes/anyData";
import { ListData as ListDataType } from "../types/dataTypes/listData";
import { ChevronButton } from "../common/ChevronButton.tsx";
import { updateNodeData, getNodeData } from "../utils/updateNodeData";

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
    <div className={`list-wrapper ${!expanded ? 'small' : ''}`}>
      <div className="list-title">
        List [{listData.payload.length}]
        <ChevronButton expanded={expanded} setExpanded={setExpanded} />
      </div>
      {expanded && (
        <div className="item-list">
          {listData.payload.map((item, idx) => (
            <div key={idx} className="list-item">
              <div className="list-key">{idx}:</div>
              {/* Add additional validation here too */}
              {Array.isArray(path) ? 
                renderData(item as AnyData, [...path, 'data', 'payload', idx]) : 
                <div className="error-state">Invalid path</div>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListDataDisplay; 