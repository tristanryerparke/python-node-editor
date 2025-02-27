import { AnyData } from "../types/dataTypes/anyData";
import { ListData as ListDataType } from "../types/dataTypes/listData";
import { ChevronButton } from "../common/ChevronButton.tsx";

interface ListDataProps {
  data: AnyData;
  path: (string | number)[];
  renderData: (data: AnyData, path: (string | number)[]) => JSX.Element;
  onChange: (path: (string | number)[], newData: AnyData) => void;
}

const ListDataDisplay = ({
  data,
  path,
  renderData,
  onChange,
}: ListDataProps): JSX.Element => {
  const listData = data as ListDataType;

  const metadata = (listData as { metadata?: { expanded?: boolean } }).metadata || {};
  const expanded = metadata.expanded ?? false;
  const setExpanded = (expanded: boolean) => {
    const newData = { ...listData, metadata: { ...metadata, expanded } };
    onChange(path, newData);
  };
  
  return (
    <div className="list-wrapper">
      <div className="list-title">
        List [{listData.payload.length}]
        <ChevronButton expanded={expanded} setExpanded={setExpanded} />
      </div>
      {expanded && (
        <div className="item-list">
          {listData.payload.map((item, idx) => (
            <div key={idx} className="list-item">
              <div className="list-key">{idx}:</div>
            {renderData(item as AnyData, [...path, idx])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListDataDisplay; 