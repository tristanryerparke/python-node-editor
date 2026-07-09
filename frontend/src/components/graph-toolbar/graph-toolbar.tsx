import ExecuteButton from "./execute-button";
import SaveButton from "./save-button";
import { LoadButton } from "./load-button";
import { InspectorToggle } from "./inspector-toggle";
import { NodePickerToggle } from "./node-picker-toggle";
import { ButtonGroup } from "@/components/ui/button-group";
import { SettingsModal } from "@/components/settings-modal/settings";

export default function GraphToolbar() {
  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[1000] flex flex-row items-center gap-1.5 bg-background/80 backdrop-blur-sm border rounded-lg p-1.5 shadow-lg">
      <NodePickerToggle />
      <ExecuteButton />
      <ButtonGroup className="h-6 items-center">
        <SaveButton />
        <LoadButton />
      </ButtonGroup>
      <SettingsModal />
      <InspectorToggle />
    </div>
  );
}
