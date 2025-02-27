import { ReactNode } from "react";
import { IntData, FloatData } from "../types/dataTypes/numberData";
import { ListData as ListDataType } from "../types/dataTypes/listData";
import { ModelData } from "../types/dataTypes/modelData";
import { AnyData } from "../types/dataTypes/anyData";
import NumberInput from "./leaf-inputs/NumberInput";
import { InputField } from "../types/nodeTypes";
import ModelDataDisplay from "./ModelDataDisplay";
import ListDataDisplay from "./ListDataDisplay";

// Recursive path-based data update function
const updateAtPath = (
  data: AnyData,
  path: (string | number)[],
  newData: AnyData
): AnyData => {
  if (path.length === 0) {
    if ("payload" in data) {
      return newData;
    }
    if ("metadata" in data) {
      return { ...data, metadata: { ...data.metadata, ...newData.metadata } };
    }
    return data;
  }

  if (data.class_name === "ListData") {
    const index = path[0] as number;
    const listData = data as ListDataType;
    return {
      ...listData,
      payload: listData.payload.map((child, i) =>
        i === index ? updateAtPath(child as AnyData, path.slice(1), newData) : child as AnyData
      ),
    } as ListDataType;
  }

  if ("class_parent" in data && data.class_parent === "ModelData") {
    const key = path[0] as string;
    const modelData = data as ModelData;
    const value = modelData[key as keyof ModelData];
    if (typeof value !== "string") {
      return {
        ...modelData,
        [key]: updateAtPath(value, path.slice(1), newData),
      };
    }
    if (key === "metadata") {
      return {
        ...modelData,
        metadata: { ...modelData.metadata, ...newData.metadata },
      };
    }
  }

  return data;
};


// Recursive render function
const renderData = (
  data: AnyData,
  path: (string | number)[],
  field: InputField,
  index: number,
  updateField: (newField: InputField, index: number) => void
): JSX.Element => {
  if (data != null) {
    if ("class_parent" in data && data.class_parent === "ModelData") {
      return (
        <ModelDataDisplay
          data={data}
          path={path}
          renderData={(d, p) => renderData(d, p, field, index, updateField)}
          onChange={(path, newData) => {
            const newField = { ...field };
            newField.data = updateAtPath(field.data, path, newData);
            updateField(newField, index);
          }}
        />
      );
    }

    if (data.class_name === "ListData") {
      return (
        <ListDataDisplay
          data={data}
          path={path}
          renderData={(d, p) => renderData(d, p, field, index, updateField)}
          onChange={(path, newData) => {
            const newField = { ...field };
            newField.data = updateAtPath(field.data, path, newData);
            updateField(newField, index);
          }}
        />
      );
    }

    if (data.class_name === "IntData" || data.class_name === "FloatData") {
      return (
        <div className="list-line-item">
          <NumberInput 
            data={data as IntData | FloatData} 
            path={path} 
            onChange={(path, newData) => {
              const newField = { ...field };
              newField.data = updateAtPath(field.data, path, newData);
              updateField(newField, index);
            }} 
          />
        </div>
      );
    }
  }
  return <div>None</div>
};

interface PrettyDisplayProps {
  field: InputField;
  index: number;
  updateField: (newField: InputField, index: number) => void;
}

export default function PrettyDisplay({ field, index, updateField }: PrettyDisplayProps): ReactNode {
  return (
    <div className="pne-div">
      {renderData(field.data, [], field, index, updateField)}
    </div>
  );
}

