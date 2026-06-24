import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "dark" | "light" | "system";
type ExecutionMode = "sync" | "async";

export const DEFAULT_ASYNC_EXECUTION_TIMEOUT_SECONDS = 60;
export const MIN_ASYNC_EXECUTION_TIMEOUT_SECONDS = 1;

export function normalizeAsyncExecutionTimeoutSeconds(
  timeoutSeconds: number | undefined,
): number {
  if (typeof timeoutSeconds !== "number" || !Number.isFinite(timeoutSeconds)) {
    return DEFAULT_ASYNC_EXECUTION_TIMEOUT_SECONDS;
  }

  return Math.max(
    MIN_ASYNC_EXECUTION_TIMEOUT_SECONDS,
    Math.round(timeoutSeconds),
  );
}

type SettingsStoreState = {
  theme: Theme;
  openInEditorName: string | null;
  executionMode: ExecutionMode;
  asyncExecutionTimeoutSeconds: number;
  strictInputValidation: boolean;
  warnOnEnvironmentMismatch: boolean;
  showInspectorPaths: boolean;
};

type SettingsStoreActions = {
  setTheme: (theme: Theme) => void;
  setOpenInEditorName: (editorName: string | null) => void;
  setExecutionMode: (mode: ExecutionMode) => void;
  setAsyncExecutionTimeoutSeconds: (timeoutSeconds: number) => void;
  setStrictInputValidation: (enabled: boolean) => void;
  setWarnOnEnvironmentMismatch: (enabled: boolean) => void;
  setShowInspectorPaths: (enabled: boolean) => void;
};

export type SettingsState = SettingsStoreState & SettingsStoreActions;

const useSettingsStore = createWithEqualityFn<
  SettingsState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set) => ({
      theme: "system",
      openInEditorName: "vscode",
      executionMode: "async",
      asyncExecutionTimeoutSeconds: DEFAULT_ASYNC_EXECUTION_TIMEOUT_SECONDS,
      strictInputValidation: false,
      warnOnEnvironmentMismatch: true,
      showInspectorPaths: true,

      setTheme: (theme) => set({ theme }),

      setOpenInEditorName: (editorName) =>
        set({ openInEditorName: editorName }),

      setExecutionMode: (mode) => set({ executionMode: mode }),

      setAsyncExecutionTimeoutSeconds: (timeoutSeconds) =>
        set({
          asyncExecutionTimeoutSeconds:
            normalizeAsyncExecutionTimeoutSeconds(timeoutSeconds),
        }),

      setStrictInputValidation: (enabled) =>
        set({ strictInputValidation: enabled }),

      setWarnOnEnvironmentMismatch: (enabled) =>
        set({ warnOnEnvironmentMismatch: enabled }),

      setShowInspectorPaths: (enabled) =>
        set({ showInspectorPaths: enabled }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        openInEditorName: state.openInEditorName,
        executionMode: state.executionMode,
        asyncExecutionTimeoutSeconds: state.asyncExecutionTimeoutSeconds,
        strictInputValidation: state.strictInputValidation,
        warnOnEnvironmentMismatch: state.warnOnEnvironmentMismatch,
        showInspectorPaths: state.showInspectorPaths,
      }),
    },
  ),
  shallow,
);

export default useSettingsStore;
