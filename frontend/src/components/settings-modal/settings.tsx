import { Settings, XIcon } from "lucide-react";
import { Button } from "t-components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "t-components/dialog";
import { Checkbox } from "t-components/checkbox";
import { Input } from "t-components/input";
import { Tabs, TabsList, TabsTrigger } from "t-components/tabs";
import { ThemeSelect } from "./theme-select";
import useSettingsStore, {
  DEFAULT_ASYNC_EXECUTION_TIMEOUT_SECONDS,
  MIN_ASYNC_EXECUTION_TIMEOUT_SECONDS,
  normalizeAsyncExecutionTimeoutSeconds,
} from "@/stores/settingsStore";
import useFlowStore from "@/stores/flowStore";

export function SettingsModal() {
  const openInEditorName = useSettingsStore((state) => state.openInEditorName);
  const setOpenInEditorName = useSettingsStore(
    (state) => state.setOpenInEditorName,
  );
  const executionMode = useSettingsStore((state) => state.executionMode);
  const setExecutionMode = useSettingsStore((state) => state.setExecutionMode);
  const asyncExecutionTimeoutSeconds = useSettingsStore((state) =>
    normalizeAsyncExecutionTimeoutSeconds(state.asyncExecutionTimeoutSeconds),
  );
  const setAsyncExecutionTimeoutSeconds = useSettingsStore(
    (state) => state.setAsyncExecutionTimeoutSeconds,
  );
  const showInspectorPaths = useSettingsStore(
    (state) => state.showInspectorPaths,
  );
  const setShowInspectorPaths = useSettingsStore(
    (state) => state.setShowInspectorPaths,
  );
  const strictInputValidation = useSettingsStore(
    (state) => state.strictInputValidation,
  );
  const setStrictInputValidation = useSettingsStore(
    (state) => state.setStrictInputValidation,
  );
  const warnOnEnvironmentMismatch = useSettingsStore(
    (state) => state.warnOnEnvironmentMismatch,
  );
  const setWarnOnEnvironmentMismatch = useSettingsStore(
    (state) => state.setWarnOnEnvironmentMismatch,
  );
  const clearEnvironmentMismatchWarning = useFlowStore(
    (state) => state.clearEnvironmentMismatchWarning,
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon-xs" variant="outline" aria-label="Open settings">
          <Settings className="size-3" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogClose className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:cursor-not-allowed data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Theme</label>
            <ThemeSelect />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Execution Mode</label>
            <Tabs
              value={executionMode}
              onValueChange={(value) =>
                setExecutionMode(value as "sync" | "async")
              }
            >
              <TabsList className="min-w-30 max-w-30">
                <TabsTrigger value="sync">Sync</TabsTrigger>
                <TabsTrigger value="async">Async</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="async-execution-timeout"
                className="text-sm font-medium"
              >
                Async Timeout
              </label>
              <p className="text-xs text-muted-foreground">
                Warn when async execution sends no new updates for this many
                seconds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="async-execution-timeout"
                type="number"
                min={MIN_ASYNC_EXECUTION_TIMEOUT_SECONDS}
                step={5}
                value={asyncExecutionTimeoutSeconds}
                onChange={(e) => {
                  const nextTimeoutSeconds = e.currentTarget.valueAsNumber;
                  setAsyncExecutionTimeoutSeconds(
                    Number.isFinite(nextTimeoutSeconds)
                      ? nextTimeoutSeconds
                      : DEFAULT_ASYNC_EXECUTION_TIMEOUT_SECONDS,
                  );
                }}
                className="min-w-24 max-w-24"
              />
              <span className="text-sm text-muted-foreground">sec</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="strict-input-validation"
                className="text-sm font-medium"
              >
                Strict Input Validation
              </label>
              <p className="text-xs text-muted-foreground">
                Disable execution until all unconnected node inputs are valid.
              </p>
            </div>
            <Checkbox
              id="strict-input-validation"
              checked={strictInputValidation}
              onCheckedChange={(checked) =>
                setStrictInputValidation(checked === true)
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="show-inspector-paths"
                className="text-sm font-medium"
              >
                Show Inspector Paths
              </label>
              <p className="text-xs text-muted-foreground">
                Show the selected path above inspector data.
              </p>
            </div>
            <Checkbox
              id="show-inspector-paths"
              checked={showInspectorPaths}
              onCheckedChange={(checked) =>
                setShowInspectorPaths(checked === true)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label htmlFor="editor-name" className="text-sm font-medium pt-1">
                Editor Name
              </label>
              <p className="text-xs text-muted-foreground">
                Used for "Open Source Code" links (e.g., zed://file/path)
              </p>
            </div>
            <Input
              id="editor-name"
              type="text"
              placeholder="e.g., zed, vscode"
              value={openInEditorName || ""}
              onChange={(e) => setOpenInEditorName(e.target.value || null)}
              className="min-w-30 max-w-30"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label
                htmlFor="environment-warning"
                className="text-sm font-medium pt-1"
              >
                Mismatch Warnings
              </label>
              <p className="text-xs text-muted-foreground">
                Warn when incoming flow/backend metadata has unknown callable IDs
                or types
              </p>
            </div>
            <Checkbox
              id="environment-warning"
              checked={warnOnEnvironmentMismatch}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                setWarnOnEnvironmentMismatch(enabled);
                if (!enabled) {
                  clearEnvironmentMismatchWarning();
                }
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
