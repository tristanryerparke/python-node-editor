import { Button } from "@/components/ui/button";
import useFlowStore from "../../stores/flowStore";
import useInspectorStore from "../../stores/inspectorStore";

export default function SaveButton() {
  const { rfInstance } = useFlowStore();

  const onSave = () => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      const { entries, showBorders } = useInspectorStore.getState();
      const json = JSON.stringify(
        {
          ...flow,
          inspector: {
            entries,
            showBorders,
          },
        },
        null,
        2,
      );
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `flow-${new Date().toISOString()}.json`;
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
