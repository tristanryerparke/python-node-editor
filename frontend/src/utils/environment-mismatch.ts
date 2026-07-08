import type {
  EnvironmentResponse,
  FunctionSchemas,
  TypeInfo,
} from "@/types/environment";
import { indexFunctionSchemas } from "@/types/environment";

type EnvironmentMismatchSource = "flow-load" | "backend-refetch";

interface MissingFunctionInfo {
  callableId: string;
  functionName: string;
}

export interface EnvironmentMismatchWarning {
  source: EnvironmentMismatchSource;
  message: string;
  paths: string[];
  missingFunctions: MissingFunctionInfo[];
  missingTypes: string[];
}

type FunctionSchemaReferences = FunctionSchemas | string[];

interface EnvironmentMismatchCheckInput {
  source: EnvironmentMismatchSource;
  incomingFunctionSchemas: FunctionSchemaReferences;
  incomingTypes: Record<string, TypeInfo>;
  currentFunctionSchemas: FunctionSchemaReferences;
  currentTypes: Record<string, TypeInfo>;
}

const callableIds = (functionSchemas: FunctionSchemaReferences) =>
  Array.isArray(functionSchemas)
    ? functionSchemas
    : Object.keys(functionSchemas);

const functionName = (
  functionSchemas: FunctionSchemaReferences,
  callableId: string,
) =>
  Array.isArray(functionSchemas)
    ? "Unknown function"
    : (functionSchemas[callableId]?.name ?? "Unknown function");

const hasExistingEnvironment = (
  functionSchemas: FunctionSchemaReferences,
  types: Record<string, TypeInfo>,
) => {
  return callableIds(functionSchemas).length > 0 || Object.keys(types).length > 0;
};

export const buildEnvironmentMismatchWarning = ({
  source,
  incomingFunctionSchemas,
  incomingTypes,
  currentFunctionSchemas,
  currentTypes,
}: EnvironmentMismatchCheckInput): EnvironmentMismatchWarning | null => {
  if (!hasExistingEnvironment(currentFunctionSchemas, currentTypes)) {
    return null;
  }

  const isBackendRefetch = source === "backend-refetch";
  const missingCallableIds = (
    isBackendRefetch
      ? callableIds(currentFunctionSchemas).filter(
          (callableId) => !callableIds(incomingFunctionSchemas).includes(callableId),
        )
      : callableIds(incomingFunctionSchemas).filter(
          (callableId) => !callableIds(currentFunctionSchemas).includes(callableId),
        )
  );
  const missingTypes = (
    isBackendRefetch
      ? Object.keys(currentTypes).filter(
          (typeName) => !(typeName in incomingTypes),
        )
      : Object.keys(incomingTypes).filter(
          (typeName) => !(typeName in currentTypes),
        )
  );

  if (missingCallableIds.length === 0 && missingTypes.length === 0) {
    return null;
  }

  const referenceFunctionSchemas = isBackendRefetch
    ? currentFunctionSchemas
    : incomingFunctionSchemas;

  const missingFunctions = missingCallableIds.map((callableId) => ({
    callableId,
    functionName: functionName(referenceFunctionSchemas, callableId),
  }));

  const paths = [
    ...missingFunctions.map(
      ({ callableId, functionName }) =>
        `functionSchemas.${callableId} (function: ${functionName})`,
    ),
    ...missingTypes.map((typeName) => `types.${typeName}`),
  ];

  const message = isBackendRefetch
    ? missingCallableIds.length > 0
      ? "Callable ID mismatch: current store contains callableIds that are not available from the backend."
      : "Current store contains type metadata that is not available from the backend."
    : missingCallableIds.length > 0
      ? "Callable ID mismatch: incoming function schemas contain callableIds that do not exist in the current store."
      : "Incoming type metadata contains type names that do not exist in the current store.";

  return {
    source,
    message,
    paths,
    missingFunctions,
    missingTypes,
  };
};

export const buildEnvironmentMismatchWarningFromResponse = ({
  source,
  incomingEnvironment,
  currentFunctionSchemas,
  currentTypes,
}: {
  source: EnvironmentMismatchSource;
  incomingEnvironment: EnvironmentResponse;
  currentFunctionSchemas: FunctionSchemas;
  currentTypes: Record<string, TypeInfo>;
}) => {
  return buildEnvironmentMismatchWarning({
    source,
    incomingFunctionSchemas: indexFunctionSchemas(incomingEnvironment.nodes),
    incomingTypes: incomingEnvironment.types,
    currentFunctionSchemas,
    currentTypes,
  });
};
