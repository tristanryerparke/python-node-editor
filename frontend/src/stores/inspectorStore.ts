import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";

export type InspectorPathSegment = string | number;

export interface InspectorTarget {
  nodeId: string;
  path: InspectorPathSegment[];
}

export interface InspectorEntryState {
  id: string;
  isExpanded: boolean;
  selectedTarget: InspectorTarget | null;
}

type InspectorStoreState = {
  entries: InspectorEntryState[];
  activeSelectingEntryId: string | null;
  deleteDialogEntryId: string | null;
  copiedPathEntryId: string | null;
  showBorders: boolean;
};

type InspectorStoreActions = {
  addEntry: () => void;
  removeEntry: (entryId: string) => void;
  setActiveSelectingEntryId: (entryId: string | null) => void;
  setEntryExpanded: (entryId: string, isExpanded: boolean) => void;
  setEntrySelectedTarget: (
    entryId: string,
    target: InspectorTarget | null,
  ) => void;
  selectTargetForActiveEntry: (
    nodeId: string,
    path: InspectorPathSegment[],
  ) => void;
  clearMissingTargets: (nodeIds: string[]) => void;
  setDeleteDialogEntryId: (entryId: string | null) => void;
  setCopiedPathEntryId: (entryId: string | null) => void;
  setShowBorders: (show: boolean) => void;
};

export type InspectorState = InspectorStoreState & InspectorStoreActions;

type LegacyInspectorStoreState = {
  selectedTarget?: InspectorTarget | null;
  showBorders?: boolean;
};

const createEntryId = () => crypto.randomUUID();

const createInspectorEntry = (
  selectedTarget: InspectorTarget | null = null,
): InspectorEntryState => ({
  id: createEntryId(),
  isExpanded: true,
  selectedTarget,
});

const useInspectorStore = createWithEqualityFn<
  InspectorState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set, get) => ({
      entries: [],
      activeSelectingEntryId: null,
      deleteDialogEntryId: null,
      copiedPathEntryId: null,
      showBorders: true,

      addEntry: () =>
        set((state) => ({
          entries: [...state.entries, createInspectorEntry()],
        })),

      removeEntry: (entryId) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== entryId),
          activeSelectingEntryId:
            state.activeSelectingEntryId === entryId
              ? null
              : state.activeSelectingEntryId,
          deleteDialogEntryId:
            state.deleteDialogEntryId === entryId
              ? null
              : state.deleteDialogEntryId,
          copiedPathEntryId:
            state.copiedPathEntryId === entryId ? null : state.copiedPathEntryId,
        })),

      setActiveSelectingEntryId: (entryId) =>
        set((state) => {
          if (
            entryId !== null &&
            !state.entries.some((entry) => entry.id === entryId)
          ) {
            return state;
          }

          return { activeSelectingEntryId: entryId };
        }),

      setEntryExpanded: (entryId, isExpanded) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId ? { ...entry, isExpanded } : entry,
          ),
        })),

      setEntrySelectedTarget: (entryId, target) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId ? { ...entry, selectedTarget: target } : entry,
          ),
          copiedPathEntryId:
            state.copiedPathEntryId === entryId ? null : state.copiedPathEntryId,
        })),

      selectTargetForActiveEntry: (nodeId, path) => {
        const activeSelectingEntryId = get().activeSelectingEntryId;

        if (!activeSelectingEntryId) {
          return;
        }

        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === activeSelectingEntryId
              ? {
                  ...entry,
                  isExpanded: true,
                  selectedTarget: { nodeId, path },
                }
              : entry,
          ),
          activeSelectingEntryId: null,
          copiedPathEntryId:
            state.copiedPathEntryId === activeSelectingEntryId
              ? null
              : state.copiedPathEntryId,
        }));
      },

      clearMissingTargets: (nodeIds) =>
        set((state) => {
          let copiedPathEntryId = state.copiedPathEntryId;
          let didChange = false;

          const entries = state.entries.map((entry) => {
            if (
              entry.selectedTarget &&
              !nodeIds.includes(entry.selectedTarget.nodeId)
            ) {
              didChange = true;
              if (copiedPathEntryId === entry.id) {
                copiedPathEntryId = null;
              }
              return { ...entry, selectedTarget: null };
            }

            return entry;
          });

          if (!didChange) {
            return state;
          }

          return {
            entries,
            copiedPathEntryId,
          };
        }),

      setDeleteDialogEntryId: (entryId) =>
        set((state) => {
          if (
            entryId !== null &&
            !state.entries.some((entry) => entry.id === entryId)
          ) {
            return state;
          }

          return { deleteDialogEntryId: entryId };
        }),

      setCopiedPathEntryId: (entryId) =>
        set((state) => {
          if (
            entryId !== null &&
            !state.entries.some((entry) => entry.id === entryId)
          ) {
            return state;
          }

          return { copiedPathEntryId: entryId };
        }),

      setShowBorders: (show) => set({ showBorders: show }),
    }),
    {
      name: "inspector-storage",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        if (version < 2) {
          const legacyState = persistedState as LegacyInspectorStoreState;
          const selectedTarget = legacyState.selectedTarget ?? null;

          return {
            entries: selectedTarget ? [createInspectorEntry(selectedTarget)] : [],
            activeSelectingEntryId: null,
            deleteDialogEntryId: null,
            copiedPathEntryId: null,
            showBorders: legacyState.showBorders ?? true,
          };
        }

        return persistedState;
      },
      partialize: (state) => ({
        entries: state.entries,
        showBorders: state.showBorders,
      }),
    },
  ),
  shallow,
);

export default useInspectorStore;
