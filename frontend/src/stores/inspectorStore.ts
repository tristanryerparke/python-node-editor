import { produce } from "immer";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  findItemIndexById,
  getDataAtPath,
  setDataAtPath,
} from "../utils/store-utils";

export type InspectorPathSegment = string | number;

export interface InspectorTarget {
  nodeId: string;
  path: InspectorPathSegment[];
}

export interface InspectorEntryState {
  id: string;
  isExpanded: boolean;
  customName?: string | null;
  selectedTarget: InspectorTarget | null;
  viewMode: "json" | "rich";
}

type InspectorStoreState = {
  entries: InspectorEntryState[];
  activeSelectingEntryId: string | null;
  showBorders: boolean;
};

type InspectorStoreActions = {
  addEntry: () => void;
  setActiveSelectingEntryId: (entryId: string | null) => void;
  getInspectorData: (path: InspectorPathSegment[]) => unknown;
  updateInspectorData: (
    path: InspectorPathSegment[],
    newData: unknown,
  ) => void;
  deleteInspectorData: (entryId: InspectorPathSegment) => void;
  selectTargetForActiveEntry: (
    nodeId: string,
    path: InspectorPathSegment[],
  ) => void;
  clearMissingTargets: (nodeIds: string[]) => void;
  setShowBorders: (show: boolean) => void;
};

export type InspectorState = InspectorStoreState & InspectorStoreActions;

const createEntryId = () => crypto.randomUUID();

const createInspectorEntry = (
  selectedTarget: InspectorTarget | null = null,
): InspectorEntryState => ({
  id: createEntryId(),
  isExpanded: true,
  customName: null,
  selectedTarget,
  viewMode: "rich",
});

function findInspectorEntryIndexById(
  entries: InspectorEntryState[],
  entryId: InspectorPathSegment,
) {
  return findItemIndexById(entries, entryId);
}

function getInspectorDataFromState(
  state: Pick<InspectorState, keyof InspectorStoreState>,
  path: InspectorPathSegment[],
) {
  const entryIndex = findInspectorEntryIndexById(state.entries, path[0]);

  if (entryIndex === -1) {
    return undefined;
  }

  return path.length === 1
    ? state.entries[entryIndex]
    : getDataAtPath(state.entries[entryIndex], path.slice(1));
}

const useInspectorStore = createWithEqualityFn<
  InspectorState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set, get) => ({
      entries: [],
      activeSelectingEntryId: null,
      showBorders: true,

      addEntry: () =>
        set((state) => ({
          entries: [...state.entries, createInspectorEntry()],
        })),

      setActiveSelectingEntryId: (entryId) =>
        set((state) => {
          if (
            entryId !== null &&
            findInspectorEntryIndexById(state.entries, entryId) === -1
          ) {
            return state;
          }

          return { activeSelectingEntryId: entryId };
        }),

      getInspectorData: (path) => getInspectorDataFromState(get(), path),

      updateInspectorData: (path, newData) =>
        set(
          produce((state: InspectorState) => {
            const entryIndex = findInspectorEntryIndexById(
              state.entries,
              path[0],
            );

            if (entryIndex === -1) {
              return;
            }

            if (path.length === 1) {
              state.entries[entryIndex] = newData as InspectorEntryState;
              return;
            }

            setDataAtPath(
              state.entries[entryIndex] as unknown as Record<
                string | number,
                unknown
              >,
              path.slice(1),
              newData,
            );
          }),
        ),

      deleteInspectorData: (entryId) =>
        set(
          produce((state: InspectorState) => {
            const entryIndex = findInspectorEntryIndexById(state.entries, entryId);

            if (entryIndex === -1) {
              return;
            }

            state.entries.splice(entryIndex, 1);
            state.activeSelectingEntryId =
              state.activeSelectingEntryId === entryId
                ? null
                : state.activeSelectingEntryId;
          }),
        ),

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
        }));
      },

      clearMissingTargets: (nodeIds) =>
        set((state) => {
          let didChange = false;

          const entries = state.entries.map((entry) => {
            if (
              entry.selectedTarget &&
              !nodeIds.includes(entry.selectedTarget.nodeId)
            ) {
              didChange = true;
              return { ...entry, selectedTarget: null };
            }

            return entry;
          });

          if (!didChange) {
            return state;
          }

          return { entries };
        }),

      setShowBorders: (show) => set({ showBorders: show }),
    }),
    {
      name: "inspector-storage",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        entries: state.entries,
        showBorders: state.showBorders,
      }),
    },
  ),
  shallow,
);

export const updateInspectorData = (
  path: InspectorPathSegment[],
  newData: unknown,
) => useInspectorStore.getState().updateInspectorData(path, newData);

export const deleteInspectorData = (entryId: InspectorPathSegment) =>
  useInspectorStore.getState().deleteInspectorData(entryId);

export const setActiveSelectingEntryId = (entryId: string | null) =>
  useInspectorStore.getState().setActiveSelectingEntryId(entryId);

export default useInspectorStore;
