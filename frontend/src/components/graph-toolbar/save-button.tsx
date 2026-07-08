import { Button } from "@/components/ui/button";
import useFlowStore from "../../stores/flowStore";
import useInspectorStore from "../../stores/inspectorStore";

export default function SaveButton() {
  const { rfInstance, functionSchemas, types } = useFlowStore();

  const onSave = () => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      const { entries, showBorders } = useInspectorStore.getState();
      const flowWithEnvironment = {
        ...flow,
        functionSchemaCallableIds: Object.keys(functionSchemas),
        types,
        inspector: {
          entries,
          showBorders,
        },
      };
      const json = JSON.stringify(flowWithEnvironment, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `flow-${new Date().toISOString()}.pnejson`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Button className="flex-1" onClick={onSave} variant="outline" size="sm">
      Save
    </Button>
  );
}
