import { BaseData, ListData, ModelData } from "../types/dataTypes";

export const isBasicData = (data: BaseData): data is BaseData => {
  return ['IntData', 'FloatData', 'StringData', 'BoolData'].includes(data.class_name);
}

export const isListData = (data: BaseData): data is ListData => {
  return data.class_name === 'ListData';
}

export const isModelData = (data: BaseData): data is ModelData => {
  if ('class_parent' in data) {
    return data.class_parent === 'ModelData';
  }
  return false;
}

export const isImageData = (data: BaseData): data is ImageData => {
  return data.class_name === 'ImageData';
}