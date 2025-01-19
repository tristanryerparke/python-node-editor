import { type AnyData, type BasicData, isBasicData } from "../types/dataTypes/anyData";
import { isListData } from "../types/dataTypes/listData";
import { isModelData, type ModelData } from "../types/dataTypes/modelData";
import { isImageData, type ImageData } from "../types/dataTypes/imageData";
import { isNumpyData } from "../types/dataTypes/numpyData";

export default function MinifiedDisplay({ data }: { data: AnyData }) {

  if (data == null) {
    return <div>no data</div>;
  }

  if (isBasicData(data)) {
    const basicData = data as BasicData;
    return <div>
      {`${basicData.class_name.replace('Data', '')}: ${basicData.payload ?? 'no data'}`}
    </div>;
  } else if (isListData(data)) {
    return <div>
      {`${data.class_name.replace('Data', '')}[${data.payload.length}]`}
    </div>;
  } else if (isModelData(data)) {
    const modelData = data as ModelData;
    return <div>
      {`${modelData.class_name.replace('Data', '')}(${Object.keys(modelData).length})`}
    </div>;
  } else if (isImageData(data)) {
    const imageData = data as ImageData;
    return <div>
      {`${imageData.class_name.replace('Data', '')}(${imageData.description})`}
    </div>;
  } else if (isNumpyData(data)) {
    return <div>
      {`${data.class_name.replace('Data', '')}: ${JSON.stringify(data.payload)}`}
    </div>;
  }

  return <div>
    {`unknown data type: ${JSON.stringify(data)}`}
  </div>;
}