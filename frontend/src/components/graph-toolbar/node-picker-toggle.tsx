import { PanelLeft } from "lucide-react";
import { Button } from "t-components/button";
import usePanelsStore from "@/stores/panelsStore";

export function NodePickerToggle() {
  const { showNodePicker, toggleNodePicker, nodePickerDisabled } =
    usePanelsStore();

  return (
    <Button
      size="icon-sm"
      onClick={toggleNodePicker}
      aria-label="Toggle node picker"
      variant={showNodePicker ? "outline" : "secondary"}
      disabled={nodePickerDisabled}
    >
      <PanelLeft className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Toggle node picker</span>
    </Button>
  );
}
