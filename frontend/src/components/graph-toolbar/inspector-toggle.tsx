import { PanelRight } from "lucide-react";
import { Button } from "t-components/button";
import usePanelsStore from "@/stores/panelsStore";

export function InspectorToggle() {
  const { showInspector, toggleInspector, inspectorDisabled } =
    usePanelsStore();

  return (
    <Button
      size="icon-xs"
      onClick={toggleInspector}
      aria-label="Toggle inspector"
      variant={showInspector ? "outline" : "secondary"}
      disabled={inspectorDisabled}
      className="hover:border-ring"
    >
      <PanelRight className="size-3" />
      <span className="sr-only">Toggle inspector</span>
    </Button>
  );
}
