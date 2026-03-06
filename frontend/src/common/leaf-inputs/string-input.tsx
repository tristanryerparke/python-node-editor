import { memo } from "react";
import GenericSchemaInput from "./generic-schema-input";
import type { CustomInputProps } from "@/hooks/useInputField";

const encodeAsJsonString = (value: string) => JSON.stringify(value);
const valueToPlainText = (value: unknown): string =>
  typeof value === "string" ? value : "";

export default memo(function StringInput({ inputData, path }: CustomInputProps) {
  return (
    <GenericSchemaInput
      inputData={inputData}
      path={path}
      placeholder="Enter text"
      displayToRawInput={encodeAsJsonString}
      valueToDisplay={valueToPlainText}
    />
  );
});
