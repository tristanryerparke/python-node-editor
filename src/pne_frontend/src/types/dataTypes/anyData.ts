import { BaseData } from "./baseData";
import { BoolData } from "./boolData";
import { FloatData } from "./numberData";
import { IntData } from "./numberData";
import { StringData } from "./stringData";
import { ListData } from "./listData";
import { ModelData } from "./modelData";
import { NumpyData } from "./numpyData";
import { ImageData } from "./imageData";

export type AnyData =
  | BaseData
  | FloatData
  | IntData
  | StringData
  | BoolData
  | ListData
  | ModelData
  | NumpyData
  | ImageData;
