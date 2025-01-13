import { AnyData, BaseData, ListData, ModelData, ImageData, NumpyData } from "../types/dataTypes";

export const isBasicData = (data: AnyData): data is BaseData => {
  return ['IntData', 'FloatData', 'StringData', 'BoolData'].includes(data.class_name);
}

export const isListData = (data: AnyData): data is ListData => {
  return data.class_name === 'ListData';
}

export const isModelData = (data: BaseData): data is ModelData => {
  if ('class_parent' in data) {
    return data.class_parent === 'ModelData';
  }
  return false;
}

export const isImageData = (data: AnyData): data is ImageData => {
  if ('class_name' in data) {
    const imageData = data as ImageData;
    return imageData.class_name === 'ImageData';
  }
  return false;
}

export const isNumpyData = (data: AnyData): data is NumpyData => {
  return data.class_name === 'NumpyData';
}