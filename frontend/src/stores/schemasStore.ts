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
  fetchNodeSchemas: () => Promise<void>;
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

      fetchNodeSchemas: async () => {
        try {
          const response = await fetch("http://localhost:8000/nodes");
          const data = await response.json();
          console.log("node schemas:", data);
          set({ nodeSchemas: data });
        } catch (error) {
          console.error("Failed to fetch node schemas:", error);
        }
      },
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
