import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FrontendNodeData } from "@/types/types";
import { queryClient } from "@/lib/query-client";
import { nodeSchemasQueryOptions } from "@/lib/backend-query-options";

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
          const data = await queryClient.fetchQuery(nodeSchemasQueryOptions);
          console.log("node schemas:", data);
          set({ nodeSchemas: data as NodesResponse });
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
