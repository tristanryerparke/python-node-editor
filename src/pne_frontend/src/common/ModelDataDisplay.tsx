import { AnyData } from "../types/dataTypes/anyData";
import { ModelData as ModelDataType } from "../types/dataTypes/modelData";
import { ChevronButton } from "../common/ChevronButton.tsx";

interface ModelDataProps {
  data: AnyData;
  path: (string | number)[];
  renderData: (data: AnyData, path: (string | number)[]) => JSX.Element;
  onChange: (path: (string | number)[], newData: AnyData) => void;
}

const ModelDataDisplay = ({
  data,
  path,
  renderData,
  onChange,
}: ModelDataProps): JSX.Element => {
  const modelData = data as ModelDataType;

  const metadata = (modelData as { metadata?: { expanded?: boolean } }).metadata || {};
  const expanded = metadata.expanded ?? false;
  const setExpanded = (expanded: boolean) => {
    const newData = { ...modelData, metadata: { ...metadata, expanded } };
    onChange(path, newData);
  };

  return (
    <div className="list-wrapper">
      <div className="list-title">
        {modelData.class_name}({modelData.class_parent})
        <ChevronButton expanded={expanded} setExpanded={setExpanded} />
      </div>
      {expanded && (
        <div className="item-list">
          {Object.entries(modelData)
            .filter(([key]) => key !== "class_name" && key !== "class_parent" && key !== "id" && key !== "metadata")
            .map(([key, value]) => {
              if (typeof value === "object") {
                return (
                  <div key={key} className="list-item">
                    <div className="list-key">{key}:</div>
                    {renderData(value as AnyData, [...path, key])}
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