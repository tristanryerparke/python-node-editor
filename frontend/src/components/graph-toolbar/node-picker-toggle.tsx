import { PanelLeft } from "lucide-react";
import { Button } from "t-components/button";
import usePanelsStore from "@/stores/panelsStore";

export function NodePickerToggle() {
  const { showNodePicker, toggleNodePicker, nodePickerDisabled } =
    usePanelsStore();

  return (
    <Button
      size="icon-xs"
      onClick={toggleNodePicker}
      aria-label="Toggle node picker"
      variant={showNodePicker ? "outline" : "secondary"}
      disabled={nodePickerDisabled}
      className="hover:border-ring"
    >
      <PanelLeft className="size-3" />
      <span className="sr-only">Toggle node picker</span>
    </Button>
  );
}
