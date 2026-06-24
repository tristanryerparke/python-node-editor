import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSelect } from "./theme-select";
import { API_PREFIX } from "@/lib/fetcher";
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
        <Button size="icon-sm" variant="outline" aria-label="Open settings">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
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
              <TabsList className="min-w-30 max-w-30 min-h-9">
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
                className="min-w-24 max-w-24 min-h-9"
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
              className="min-w-30 max-w-30 min-h-9"
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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Backend API</label>
            <div className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded-md">
              {API_PREFIX}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
