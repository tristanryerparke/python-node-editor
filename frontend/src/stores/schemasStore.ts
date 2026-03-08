import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FrontendNodeData } from "@/types/types";

export interface NodesResponse {
  [functionName: string]: FrontendNodeData;
}

type SchemasStoreState = {
  nodeSchemas: NodesResponse;
};

type SchemasStoreActions = {
  setNodeSchemas: (nodeSchemas: NodesResponse) => void;
};

export type SchemasState = SchemasStoreState & SchemasStoreActions;

const useSchemasStore = createWithEqualityFn<
  SchemasState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set) => ({
      nodeSchemas: {},

      setNodeSchemas: (nodeSchemas) => set({ nodeSchemas }),
    }),
    {
      name: "schemas-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodeSchemas: state.nodeSchemas,
      }),
    },
  ),
  shallow,
);

export default useSchemasStore;
