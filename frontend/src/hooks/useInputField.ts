import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounceCallback } from "usehooks-ts";
import useFlowStore from "@/stores/flowStore";
import type { FrontendFieldDataWrapper } from "@/types/types";

interface UseInputFieldOptions {
  delay?: number;
}

interface UseInputFieldResult<T> {
  value: T;
  setValue: (value: T, debounce?: number) => Promise<void>;
}

export function useInputField<T = unknown>(
  inputData: FrontendFieldDataWrapper,
  path: (string | number)[],
  options?: UseInputFieldOptions,
): UseInputFieldResult<T> {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const defaultDelay = options?.delay ?? 200;

  const externalValue = inputData.value as T;

  const [localValue, setLocalValue] = useState<T>(externalValue);
  const lastCallbackValue = useRef<T>(externalValue);
  const isUserTyping = useRef(false);

  const writeToStore = useCallback(
    (value: T): Promise<void> => {
      lastCallbackValue.current = value;
      isUserTyping.current = false;
      return updateNodeData([...path, "value"], value, { fromUser: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateNodeData, ...path],
  );

  const debouncedWrite = useDebounceCallback((value: T) => {
    void writeToStore(value);
  }, defaultDelay);

  useEffect(() => {
    if (isUserTyping.current) return;
    if (externalValue !== lastCallbackValue.current) {
      setLocalValue(externalValue);
      lastCallbackValue.current = externalValue;
    }
  }, [externalValue]);

  const setValue = useCallback(
    (newValue: T, debounce?: number): Promise<void> => {
      const effectiveDelay = debounce ?? defaultDelay;
      setLocalValue(newValue);
      if (effectiveDelay === 0) {
        debouncedWrite.cancel();
        return writeToStore(newValue);
      }
      isUserTyping.current = true;
      debouncedWrite(newValue);
      return Promise.resolve();
    },
    [defaultDelay, writeToStore, debouncedWrite],
  );

  return { value: localValue, setValue };
}
