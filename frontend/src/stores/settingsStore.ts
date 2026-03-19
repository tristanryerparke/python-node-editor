import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "dark" | "light" | "system";
type ExecutionMode = "sync" | "async";

type SettingsStoreState = {
  theme: Theme;
  openInEditorName: string | null;
  executionMode: ExecutionMode;
  warnOnEnvironmentMismatch: boolean;
};

type SettingsStoreActions = {
  setTheme: (theme: Theme) => void;
  setOpenInEditorName: (editorName: string | null) => void;
  setExecutionMode: (mode: ExecutionMode) => void;
  setWarnOnEnvironmentMismatch: (enabled: boolean) => void;
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
      warnOnEnvironmentMismatch: true,

      setTheme: (theme) => set({ theme }),

      setOpenInEditorName: (editorName) =>
        set({ openInEditorName: editorName }),

      setExecutionMode: (mode) => set({ executionMode: mode }),

      setWarnOnEnvironmentMismatch: (enabled) =>
        set({ warnOnEnvironmentMismatch: enabled }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        openInEditorName: state.openInEditorName,
        executionMode: state.executionMode,
        warnOnEnvironmentMismatch: state.warnOnEnvironmentMismatch,
      }),
    },
  ),
  shallow,
);

export default useSettingsStore;
