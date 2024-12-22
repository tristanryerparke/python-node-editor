export interface FloatData {
  id: string | any
  payload: number
  preview: string | any
  metadata: Record<string, any>
}

export interface IntData {
  id: string | any
  payload: number
  preview: string | any
  metadata: Record<string, any>
}

export interface NumpyData {
  id: string | any
  payload: number[]
  preview: string | any
  metadata: Record<string, any>
}

export interface StringData {
  id: string | any
  payload: string
  preview: string | any
  metadata: Record<string, any>
}

export interface ImageData {
  id: string | any
  payload: string
  preview: string | any
  metadata: Record<string, any>
  height: number | any
  width: number | any
  image_type: string | any
}

export interface BaseData {
  id: string | any
  payload: any
  preview: string | any
  metadata: Record<string, any>
}

export interface ListData {
  payload: BaseData[]
}

export interface Document {
  image: ImageData
  units: StringData
  width: FloatData
  height: FloatData
}