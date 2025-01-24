import { ReactNode } from "react";
import NumberInput from "./inputs/NumberInput";
import { useField } from '../contexts/FieldContext';
import { InputDataUpdateContext } from "../contexts/inputDataContext";
import { AnyData } from "../types/dataTypes/anyData";
import { ListData } from "../types/dataTypes/listData";
import { FloatData } from "../types/dataTypes/numberData";
import { IntData } from "../types/dataTypes/numberData";
import { Accordion } from "@mantine/core";

function RenderData(
  data: AnyData,
  updateData: (newVal: AnyData) => void
): ReactNode {

  if (data.class_name === 'ListData') {
    // cast to ListData for clarity
    const listDataObject = data as ListData;

    // function to handle items update
    const handleItemUpdate = (index: number, updatedItem: AnyData) => {
      const newPayload = [...listDataObject.payload];
      newPayload[index] = updatedItem;
      updateData({ ...listDataObject, payload: newPayload });
    };

    // Wrap the list content in an Accordion to allow minimize/maximize for each list
    return (
      <Accordion multiple variant="contained" defaultValue={['list']}>
        <Accordion.Item value="list">
          <Accordion.Control w='100%'>List [{listDataObject.payload.length}]</Accordion.Control>
          <Accordion.Panel p={0}>
            <div className="pne-div" style={{ gap: '5px' }}>
              {listDataObject.payload.map((item, idx) => (
                <div
                  key={idx}
                  className="pne-div"
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <div style={{ marginRight: '5px', minWidth: '15px' }}>{idx}:</div>
                  <InputDataUpdateContext.Provider
                    value={{ updateData: newVal => handleItemUpdate(idx, newVal)}}
                  >
                    {RenderData(item, newVal => handleItemUpdate(idx, newVal))}
                  </InputDataUpdateContext.Provider>
                </div>
              ))}
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    );

  } else if (data.class_name === 'IntData' || data.class_name === 'FloatData') {
    // numeric data case
    return (
      <InputDataUpdateContext.Provider value={{ updateData }}>
        <NumberInput oldData={data as FloatData | IntData} />
      </InputDataUpdateContext.Provider>
    );

  } else {
    // fallback for unsupported data
    return <div>No input for {data.class_name}</div>;
  }
}

export default function PrettyDisplay(): ReactNode {
  const { field, updateField, index } = useField();

  // Update callback function for non-structured data inputs
  const baseLevelDataUpdate = (newData: AnyData) => {
    updateField(
      {
        ...field,
        data: newData
      },
      index
    );
  };

  // Call our new recursive renderer
  return (
    <div className="pne-div">
      {RenderData(field.data, baseLevelDataUpdate)}
    </div>
  );

  // setState(state)
}

/*
RenderData(nodeId, baseLevelDataUpdate)
*/