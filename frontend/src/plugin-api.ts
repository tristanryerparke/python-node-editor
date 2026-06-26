export {
  registerInputRenderer,
  getInputRenderer,
  hasInputRenderer,
} from "@/common/inputs/input-type-registry";
export type { InputRegistryEntry } from "@/common/inputs/input-type-registry";

export {
  registerOutputRenderer,
  getOutputRenderer,
  hasOutputRenderer,
} from "@/common/outputs/output-type-registry";
export type { OutputRegistryEntry } from "@/common/outputs/output-type-registry";

export {
  registerLargeDataSerializer,
  serializeLargeData,
} from "@/utils/large-data-serializer-registry";
export type { LargeDataSerializer } from "@/utils/large-data-serializer-registry";
