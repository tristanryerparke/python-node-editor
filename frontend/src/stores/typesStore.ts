import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TypeExpr, UnionDescr } from "../types/backend-schema";
import { queryClient } from "@/lib/query-client";
import { typesQueryOptions } from "@/lib/backend-query-options";

export type PropertyType = TypeExpr;

export interface TypeInfo {
  kind: string;
  category?: string[];
  type?: string | UnionDescr;
  properties?: Record<string, PropertyType> | null;
  [key: string]: unknown;
}

type TypesStoreState = {
  types: Record<string, TypeInfo>;
};

type TypesStoreActions = {
  setTypes: (types: Record<string, TypeInfo>) => void;
  fetchTypes: () => Promise<void>;
};

export type TypesState = TypesStoreState & TypesStoreActions;

const useTypesStore = createWithEqualityFn<
  TypesState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set) => ({
      types: {},

      setTypes: (types) => set({ types }),

      fetchTypes: async () => {
        try {
          const data = await queryClient.fetchQuery(typesQueryOptions);
          console.log("types:", data);
          set({ types: data as Record<string, TypeInfo> });
        } catch (error) {
          console.error("Failed to fetch types:", error);
        }
      },
    }),
    {
      name: "types-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        types: state.types,
      }),
    },
  ),
  shallow,
);

export default useTypesStore;
