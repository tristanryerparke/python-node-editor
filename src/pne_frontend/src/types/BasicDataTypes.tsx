import { BaseData } from "./BaseDataTypes";


export interface FloatData extends BaseData {
    payload: number;
}

export interface IntData extends BaseData {
    payload: number;
}

export interface StringData extends BaseData {
    payload: string;
}

export interface ListData extends BaseData {
    payload: BaseData[];
}

export interface NumpyData extends BaseData {
    payload: unknown;
}

export interface ImageData extends BaseData {
    payload: unknown;
    height: number;
    width: number;
    image_type: string;
}