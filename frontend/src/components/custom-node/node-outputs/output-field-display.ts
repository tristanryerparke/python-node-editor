import type { TypeSchema } from "@/types/backend-schema";

export interface ControlledOutputProps {
  value: unknown;
  expanded?: boolean;
  typeSchema?: TypeSchema;
}
