import { Button } from "t-components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "t-components/dialog";
import useFlowStore from "@/stores/flowStore";

const sourceLabel: Record<"flow-load" | "backend-refetch", string> = {
  "flow-load": "Flow file load",
  "backend-refetch": "Backend refetch",
};

export function EnvironmentMismatchDialog() {
  const warning = useFlowStore((state) => state.environmentMismatchWarning);
  const clearWarning = useFlowStore(
    (state) => state.clearEnvironmentMismatchWarning,
  );
  const open = warning !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          clearWarning();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Environment Mismatch Detected</DialogTitle>
          <DialogDescription>
            {warning?.message}
          </DialogDescription>
        </DialogHeader>
        {warning && (
          <div className="text-sm space-y-2">
            <div className="text-muted-foreground">
              Source: {sourceLabel[warning.source]}
            </div>
            {warning.missingFunctions.length > 0 && (
              <div className="max-h-56 overflow-auto rounded-md border bg-muted/40 p-2">
                <div className="text-xs font-medium mb-1">
                  Functions No Longer Available
                </div>
                <ul className="list-disc pl-5 text-xs font-mono space-y-1">
                  {warning.missingFunctions.map(
                    ({ callableId, functionName }) => (
                      <li key={callableId}>
                        {functionName} ({callableId})
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
            {warning.missingTypes.length > 0 && (
              <div className="max-h-56 overflow-auto rounded-md border bg-muted/40 p-2">
                <div className="text-xs font-medium mb-1">
                  Types No Longer Available
                </div>
                <ul className="list-disc pl-5 text-xs font-mono space-y-1">
                  {warning.missingTypes.map((typeName) => (
                    <li key={typeName}>{typeName}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button onClick={clearWarning}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
