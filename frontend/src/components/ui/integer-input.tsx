import { memo } from "react";
import { NumberInput, type NumberInputProps } from "t-components/number-input";
import { cn } from "@/lib/utils";

export interface IntegerInputProps
  extends Omit<NumberInputProps, "coerceValue" | "decimalScale"> {}

function coerceIntegerValue(value: number | undefined): number | undefined {
  return Number.isInteger(value) ? value : undefined;
}

export default memo(function IntegerInput({ className, ...props }: IntegerInputProps) {
  return (
    <NumberInput
      {...props}
      className={cn("flex-1 w-full nodrag nopan nowheel", className)}
      decimalScale={0}
      coerceValue={coerceIntegerValue}
    />
  );
});
