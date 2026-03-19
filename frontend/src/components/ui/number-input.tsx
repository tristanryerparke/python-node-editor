import { ChevronDown, ChevronUp } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  NumericFormat,
  type NumberFormatValues,
  type SourceInfo,
} from "react-number-format";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface NumberInputProps {
  value?: number;
  onValueChange?: (value: number | undefined) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
  decimalScale?: number;
  step?: number;
  allowNegative?: boolean;
  coerceValue?: (value: number | undefined) => number | undefined;
}

function getDisplayValue(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

export default memo(function NumberInput({
  value,
  onValueChange,
  disabled = false,
  invalid = false,
  placeholder = "Enter number",
  className,
  decimalScale = 0,
  step = 1,
  allowNegative = true,
  coerceValue,
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draftValue, setDraftValue] = useState(() => getDisplayValue(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraftValue(getDisplayValue(value));
    }
  }, [isFocused, value]);

  const normalizeValue = useCallback(
    (nextValue: number | undefined) => {
      if (coerceValue) {
        return coerceValue(nextValue);
      }

      return nextValue;
    },
    [coerceValue],
  );

  const handleIncrement = useCallback(() => {
    const nextValue = value === undefined ? step : value + step;
    setDraftValue(String(nextValue));
    onValueChange?.(normalizeValue(nextValue));
  }, [normalizeValue, onValueChange, step, value]);

  const handleDecrement = useCallback(() => {
    const nextValue = value === undefined ? -step : value - step;
    setDraftValue(String(nextValue));
    onValueChange?.(normalizeValue(nextValue));
  }, [normalizeValue, onValueChange, step, value]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== inputRef.current) {
        return;
      }

      if (e.key === "ArrowUp") {
        handleIncrement();
      } else if (e.key === "ArrowDown") {
        handleDecrement();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDecrement, handleIncrement]);

  const handleValueChange = useCallback(
    (values: NumberFormatValues, sourceInfo: SourceInfo) => {
      const eventTarget = sourceInfo.event?.target as HTMLInputElement | null;
      const nextDraftValue =
        sourceInfo.source === "event" && eventTarget
          ? eventTarget.value
          : values.formattedValue;
      const nextValue = normalizeValue(values.floatValue);

      setDraftValue(nextDraftValue);

      if (sourceInfo.source === "event") {
        onValueChange?.(nextValue);
      }
    },
    [normalizeValue, onValueChange],
  );

  return (
    <div
      className={cn(
        "flex items-center flex-1 rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] overflow-hidden",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        !disabled &&
          invalid &&
          "border-invalid focus-within:border-invalid",
        "nodrag nopan nowheel",
        className,
      )}
    >
      <NumericFormat
        value={draftValue}
        onValueChange={handleValueChange}
        decimalScale={decimalScale}
        allowNegative={allowNegative}
        aria-invalid={invalid}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        customInput={Input}
        placeholder={placeholder}
        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none relative h-full rounded-none border-0 shadow-none focus-visible:border-transparent focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0"
        getInputRef={inputRef}
        disabled={disabled}
      />
      <div className="flex flex-col h-8">
        <Button
          aria-label="Increase value"
          className="px-0.5 py-0 rounded-none border-0 border-l border-b border-input bg-transparent shadow-none focus-visible:relative focus-visible:border-input focus-visible:ring-0 h-4 w-4 min-h-0"
          variant="outline"
          onClick={handleIncrement}
          disabled={disabled}
        >
          <ChevronUp size={10} />
        </Button>
        <Button
          aria-label="Decrease value"
          className="px-0.5 py-0 rounded-none border-0 border-l border-input bg-transparent shadow-none focus-visible:relative focus-visible:border-input focus-visible:ring-0 h-4 w-4 min-h-0"
          variant="outline"
          onClick={handleDecrement}
          disabled={disabled}
        >
          <ChevronDown size={10} />
        </Button>
      </div>
    </div>
  );
});
