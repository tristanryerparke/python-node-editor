import { memo } from "react";
import GenericSchemaInput from "./generic-schema-input";
import type { DataWrapper } from "@/types/backend-schema";

interface StringInputProps {
  inputData: DataWrapper;
  path: (string | number)[];
}

const encodeAsJsonString = (value: string) => JSON.stringify(value);
const valueToPlainText = (value: unknown): string =>
  typeof value === "string" ? value : "";

export default memo(function StringInput({ inputData, path }: StringInputProps) {
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
