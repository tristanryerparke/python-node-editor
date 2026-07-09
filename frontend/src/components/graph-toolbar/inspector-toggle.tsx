import { PanelRight } from "lucide-react";
import { Button } from "t-components/button";
import usePanelsStore from "@/stores/panelsStore";

export function InspectorToggle() {
  const { showInspector, toggleInspector, inspectorDisabled } =
    usePanelsStore();

  return (
    <Button
      size="icon-sm"
      onClick={toggleInspector}
      aria-label="Toggle inspector"
      variant={showInspector ? "outline" : "secondary"}
      disabled={inspectorDisabled}
    >
      <PanelRight className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Toggle inspector</span>
    </Button>
  );
}
