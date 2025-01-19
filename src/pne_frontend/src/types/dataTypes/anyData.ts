import { type BoolData } from "./boolData";
import { type FloatData } from "./numberData";
import { type IntData } from "./numberData";
import { type StringData } from "./stringData";
import { isListData, type ListData } from "./listData";
import { isModelData, type ModelData } from "./modelData";
import { type NumpyData } from "./numpyData";
import { type ImageData } from "./imageData";

export type BasicData =
  | FloatData
  | IntData
  | StringData
  | BoolData
  | NumpyData
  | ImageData;

export type AnyData =
  | BasicData
  | ListData
  | ModelData;


export const isBasicData = (data: AnyData): boolean => {
  if (!isListData(data) && !isModelData(data)) {
    return true;
  }
  return false;
}
