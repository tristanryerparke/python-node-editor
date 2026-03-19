import { INPUT_TYPE_COMPONENT_REGISTRY } from "../components/custom-node/node-inputs/input-type-registry";
import { OUTPUT_TYPE_COMPONENT_REGISTRY } from "../components/custom-node/node-outputs/output-type-registry";

/**
 * Initializes UI-specific data for arguments and outputs:
 * - _selectedType for union type arguments
 * - _expanded for types with expandable areas (e.g., Image, str)
 * - status for tracking node execution state
 * This should be called when creating a new node (e.g., on drop).
 */
export function initializeUIData(nodeData: any): void {
  const inputRegistry = INPUT_TYPE_COMPONENT_REGISTRY as Record<
    string,
    { expandable: boolean }
  >;

  // Note: _expandedComponentWidth is not initialized here
  // It will be set dynamically when the first component is resized

  // Initialize status field for tracking execution state
  if (nodeData.status === undefined) {
    nodeData.status = "not-executed";
  }

  // Initialize _terminal_drawer object for terminal drawer state
  if (nodeData._terminal_drawer === undefined) {
    nodeData._terminal_drawer = {
      _expanded: false,
    };
  }

  // Initialize arguments
  if (nodeData.arguments) {
    Object.keys(nodeData.arguments).forEach((argName) => {
      const arg = nodeData.arguments[argName];

      // Initialize _selectedType for union types (from backend schema)
      if (
        typeof arg.type === "object" &&
        arg.type?.anyOf &&
        !arg._selectedType
      ) {
        arg._selectedType = arg.type.anyOf[0];
      }

      // Initialize _expanded for types based on registry
      const actualType = arg._selectedType || arg.type;
      if (typeof actualType === "string") {
        const registryEntry = inputRegistry[actualType];
        if (registryEntry?.expandable && arg._expanded === undefined) {
          // Default to collapsed (false)
          arg._expanded = false;
        }
      }
    });
  }

  // Initialize outputs
  if (nodeData.outputs) {
    Object.keys(nodeData.outputs).forEach((outputName) => {
      const output = nodeData.outputs[outputName];

      // Initialize _expanded for outputs with expandable areas
      const actualType =
        output._selectedType ||
        (typeof output.type === "object" && output.type?.anyOf
          ? output.type.anyOf[0]
          : output.type);

      if (typeof actualType === "string") {
        const registryEntry = OUTPUT_TYPE_COMPONENT_REGISTRY[actualType];
        if (registryEntry?.expandable) {
          if (output._expanded === undefined) {
            // Default to collapsed (false)
            output._expanded = false;
          }
        }
      }
    });
  }
}
