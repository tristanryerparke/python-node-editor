import { BaseData, ImageData, ModelData } from "../types/dataTypes";
import { isBasicData, isImageData, isListData, isModelData } from "../utils/dataUtils";










export default function ShortDisplay({ data }: { data: BaseData | ModelData }) {

  if (data == null) {
    return <div>no data</div>;
  }

  if (isBasicData(data)) {
    return <div>
      {`${data.class_name.replace('Data', '')}: ${data.payload ?? 'no data'}`}
    </div>;
  } else if (isListData(data)) {
    return <div>
      {`${data.class_name.replace('Data', '')}[${data.payload.length}]`}
    </div>;
  } else if (isModelData(data)) {
    return <div>
      {`${data.class_name.replace('Data', '')}(${Object.keys(data).length})`}
    </div>;
  } else if (isImageData(data)) {
    const imageData = data as ImageData;
    return <div>
      {`${imageData.class_name.replace('Data', '')}(${imageData.description})`}
    </div>;
  }

  return <div>
    {`unknown data type: ${JSON.stringify(data)}`}
  </div>;

}