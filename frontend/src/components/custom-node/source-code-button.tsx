import { Code } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useSettingsStore from "@/stores/settingsStore";

type SourceCodeButtonProps = {
  definitionPath: string;
};

export default memo(function SourceCodeButton({
  definitionPath,
}: SourceCodeButtonProps) {
  const openInEditorName = useSettingsStore((state) => state.openInEditorName);

  const handleClick = () => {
    const editorName = openInEditorName || "vscode";
    window.open(`${editorName}://file${definitionPath}`, "_blank");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
          >
            <Code size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Open Source Code</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
