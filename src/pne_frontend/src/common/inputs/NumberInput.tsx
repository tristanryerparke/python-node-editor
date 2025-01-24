import { NumberInput as MantineNumberInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useField } from "../../contexts/FieldContext";
import { createIntData, createFloatData, FloatData, IntData } from "../../types/dataTypes/numberData";
import { useState, useEffect, useRef } from 'react';
import { useDataUpdate } from "../../contexts/inputDataContext";

interface NumberInputProps {
  oldData: FloatData | IntData
}

export default function NumberInput({ oldData }: NumberInputProps) {
  const { field } = useField();
  const { updateData } = useDataUpdate();
  const [value, setValue] = useState<number | null>(oldData.payload as number);
  const [debouncedValue] = useDebouncedValue(value, 100);
  const isInitialMount = useRef(true);

  console.log('hello');

  /*
  oldData.payload = 5;
  setState(useStore.getState())
  */

  // Watch for changes in the debounced value and update the data
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Check for null explicitly
    if (debouncedValue !== null && debouncedValue !== oldData.payload) {
      const newData = Number.isInteger(debouncedValue)
        ? createIntData(debouncedValue)
        : createFloatData(debouncedValue);
      updateData(newData);
    }
  }, [debouncedValue, updateData, oldData.payload]);

  return <MantineNumberInput
    value={value}
    size='xs'
    disabled={field.is_edge_connected}
    onChange={(val) => setValue(val as number)}
  />;
}

// PASS PATH INSTEAD OF DATA
// COMPONENT RETRIVES AND SETS DATA WITH THE PATH
/// object(with payload) === object(with payload)


// see if this gets the old stat, look in the docs
// pass bears[0].claws[0] as clawData into the component
// set clawData.payload = 5 // see if this change that has an abitrary location in state, shows up in the new state
// useBearStore.setState(useBearStore.getState())  update it


/*
""
export default function NumberInput({ path }) {
  const number = useStore(state => state.nodes.get(path)?.data.payload);
  const setNodeData = useStore(state => state.setNodeData);
  const setNumber = (newNumber: number) => setNodeData(path, newNumber);

  console.log(path);
  return <MantineNumberInput
    value={number}
    size='xs'
    disabled={field.is_edge_connected}
    onChange={(val) => setNumber(val as number)}
  />;
}
*/


// state object, called nodes const nodes = fufud

// have ['nodeId','inputs','A',]
// 

/*
let thing = nodes;
for (let i = 0; i < path.length; i++) {
  thing = thing[path[i]];
}
  return thing;
*/

// 