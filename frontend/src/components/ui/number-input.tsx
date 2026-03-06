import { ChevronDown, ChevronUp } from "lucide-react";
import { forwardRef, useCallback, useEffect, useRef } from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<NumericFormatProps, "value" | "onValueChange"> {
  stepper?: number;
  thousandSeparator?: string;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  value?: number; // Controlled value
  suffix?: string;
  prefix?: string;
  onValueChange?: (value: number | undefined) => void;
  fixedDecimalScale?: boolean;
  decimalScale?: number;
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      stepper,
      thousandSeparator,
      placeholder,
      defaultValue,
      min = -Infinity,
      max = Infinity,
      onValueChange,
      fixedDecimalScale = false,
      decimalScale = 0,
      suffix,
      prefix,
      value: controlledValue,
      className,
      disabled = false,
      invalid = false,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLInputElement>(null); // Create an internal ref
    const combinedRef = ref || internalRef; // Use provided ref or internal ref
    const currentValue = controlledValue;
    const displayValue = currentValue ?? "";

    const handleIncrement = useCallback(() => {
      const nextValue =
        currentValue === undefined
          ? (stepper ?? 1)
          : Math.min(currentValue + (stepper ?? 1), max);
      onValueChange?.(nextValue);
    }, [currentValue, stepper, max, onValueChange]);

    const handleDecrement = useCallback(() => {
      const nextValue =
        currentValue === undefined
          ? -(stepper ?? 1)
          : Math.max(currentValue - (stepper ?? 1), min);
      onValueChange?.(nextValue);
    }, [currentValue, stepper, min, onValueChange]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          document.activeElement ===
          (combinedRef as React.RefObject<HTMLInputElement>).current
        ) {
          if (e.key === "ArrowUp") {
            handleIncrement();
          } else if (e.key === "ArrowDown") {
            handleDecrement();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [handleIncrement, handleDecrement, combinedRef]);

    const handleChange = (values: {
      value: string;
      floatValue: number | undefined;
    }) => {
      const newValue =
        values.floatValue === undefined ? undefined : values.floatValue;
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    const handleBlur = () => {
      if (currentValue !== undefined) {
        if (currentValue < min) {
          onValueChange?.(min);
        } else if (currentValue > max) {
          onValueChange?.(max);
        }
      }
    };

    return (
      <div className={cn("flex items-center flex-1", className)}>
        <NumericFormat
          value={displayValue}
          onValueChange={handleChange}
          thousandSeparator={thousandSeparator}
          decimalScale={decimalScale}
          fixedDecimalScale={fixedDecimalScale}
          allowNegative={min < 0}
          valueIsNumericString
          onBlur={handleBlur}
          max={max}
          min={min}
          suffix={suffix}
          prefix={prefix}
          customInput={Input}
          placeholder={placeholder}
          className={cn(
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-r-none relative h-full",
            invalid && "border-destructive focus-visible:border-destructive",
          )}
          getInputRef={combinedRef}
          disabled={disabled}
          {...props}
        />
        <div className="flex flex-col h-8">
          <Button
            aria-label="Increase value"
            className="px-0.5 py-0 rounded-l-none rounded-br-none border-input border-l-0 border-b-[0.5px] focus-visible:relative h-4 w-4 min-h-0"
            variant="outline"
            onClick={handleIncrement}
            disabled={disabled || currentValue === max}
          >
            <ChevronUp size={10} />
          </Button>
          <Button
            aria-label="Decrease value"
            className="px-0.5 py-0 rounded-l-none rounded-tr-none border-input border-l-0 border-t-[0.5px] focus-visible:relative h-4 w-4 min-h-0"
            variant="outline"
            onClick={handleDecrement}
            disabled={disabled || currentValue === min}
          >
            <ChevronDown size={10} />
          </Button>
        </div>
      </div>
    );
  },
);
