import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounceCallback } from "usehooks-ts";

/**
 * A debounced value hook that distinguishes between:
 * - User input (debounced before callback)
 * - External updates (immediate, no debounce)
 *
 * @param externalValue - The value from an external source (props, store, etc)
 * @param onDebouncedChange - Callback when user input is debounced
 * @param delay - Debounce delay in milliseconds
 * @returns [currentValue, setValue, commitValue] - Current display value, debounced setter,
 * and immediate setter for commit events such as blur.
 */
export function useControlledDebounce<T>(
  externalValue: T,
  onDebouncedChange: (value: T) => void,
  delay: number = 200,
): [T, (value: T) => void, (value: T) => void] {
  // Track the local value for user typing
  const [localValue, setLocalValue] = useState<T>(externalValue);

  // Track the last value we sent to the callback to avoid sync loops
  const lastCallbackValue = useRef<T>(externalValue);

  // Track if user is actively typing
  const isUserTyping = useRef(false);

  // Create debounced callback for user input
  const debouncedCallback = useDebounceCallback((value: T) => {
    lastCallbackValue.current = value;
    onDebouncedChange(value);
    isUserTyping.current = false;
  }, delay);

  // Sync with external updates (e.g., from execute response)
  // But only if the user isn't actively typing
  useEffect(() => {
    // If user is typing, don't override their input with external updates
    if (isUserTyping.current) {
      return;
    }

    // Only sync if the external value is actually different from what we last sent
    if (externalValue !== lastCallbackValue.current) {
      setLocalValue(externalValue);
      lastCallbackValue.current = externalValue;
    }
  }, [externalValue]);

  // Setter for user input
  const setValue = useCallback(
    (value: T) => {
      isUserTyping.current = true;
      setLocalValue(value);
      debouncedCallback(value);
    },
    [debouncedCallback],
  );

  const commitValue = useCallback(
    (value: T) => {
      debouncedCallback.cancel();
      setLocalValue(value);
      lastCallbackValue.current = value;
      isUserTyping.current = false;
      onDebouncedChange(value);
    },
    [debouncedCallback, onDebouncedChange],
  );

  return [localValue, setValue, commitValue];
}
