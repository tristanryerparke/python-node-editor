import { ChevronDown, ChevronUp } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  NumericFormat,
  type NumberFormatValues,
  type SourceInfo,
} from "react-number-format";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import type { ControlledInputProps } from "../../components/custom-node/node-inputs/input-field-display";
import { cn } from "@/lib/utils";

export interface FloatInputProps extends ControlledInputProps {
  placeholder?: string;
}

const COMMITTED_FLOAT_PATTERN = /^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/;

function getDisplayValue(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function getCommittedFloatValue(rawValue: string): number | undefined {
  if (!COMMITTED_FLOAT_PATTERN.test(rawValue)) {
    return undefined;
  }

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

const FloatInput = memo(function ControlledFloatInput({
  value,
  onChange,
  disabled,
  valid = true,
  placeholder = "Enter float",
}: FloatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draftValue, setDraftValue] = useState(() => getDisplayValue(value));
  const [isFocused, setIsFocused] = useState(false);
  const numericValue =
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

  useEffect(() => {
    if (!isFocused) {
      setDraftValue(getDisplayValue(value));
    }
  }, [isFocused, value]);

  const handleIncrement = useCallback(() => {
    const nextValue = numericValue === undefined ? 1 : numericValue + 1;
    const nextDraftValue = String(nextValue);
    setDraftValue(nextDraftValue);
    void onChange(nextValue);
  }, [numericValue, onChange]);

  const handleDecrement = useCallback(() => {
    const nextValue = numericValue === undefined ? -1 : numericValue - 1;
    const nextDraftValue = String(nextValue);
    setDraftValue(nextDraftValue);
    void onChange(nextValue);
  }, [numericValue, onChange]);

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

      setDraftValue(nextDraftValue);

      if (sourceInfo.source === "event") {
        void onChange(getCommittedFloatValue(nextDraftValue));
      }
    },
    [onChange],
  );

  const handleBlur = () => {
    setIsFocused(false);
    setDraftValue((currentDraftValue) => {
      const committedValue = getCommittedFloatValue(currentDraftValue);
      return committedValue === undefined ? "" : String(committedValue);
    });
  };

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <div className={cn("flex items-center flex-1", "nodrag nopan nowheel")}>
        <NumericFormat
          value={draftValue}
          onValueChange={handleValueChange}
          decimalScale={3}
          allowNegative
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          customInput={Input}
          placeholder={placeholder}
          className={cn(
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-r-none relative h-full",
            !valid && "border-destructive focus-visible:border-destructive",
          )}
          getInputRef={inputRef}
          disabled={disabled}
        />
        <div className="flex flex-col h-8">
          <Button
            aria-label="Increase value"
            className="px-0.5 py-0 rounded-l-none rounded-br-none border-input border-l-0 border-b-[0.5px] focus-visible:relative h-4 w-4 min-h-0"
            variant="outline"
            onClick={handleIncrement}
            disabled={disabled}
          >
            <ChevronUp size={10} />
          </Button>
          <Button
            aria-label="Decrease value"
            className="px-0.5 py-0 rounded-l-none rounded-tr-none border-input border-l-0 border-t-[0.5px] focus-visible:relative h-4 w-4 min-h-0"
            variant="outline"
            onClick={handleDecrement}
            disabled={disabled}
          >
            <ChevronDown size={10} />
          </Button>
        </div>
      </div>
    </div>
  );
});

export default FloatInput;
