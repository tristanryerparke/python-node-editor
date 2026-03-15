import { createContext, useContext, useMemo } from "react";
import useInspectorStore, { updateInspectorData } from "@/stores/inspectorStore";

export type FieldRenderMode = "node" | "inspector";

export interface FieldRenderContextValue {
  mode: FieldRenderMode;
  getHeightForPath: (path: (string | number)[]) => number | undefined;
  setHeightForPath: (path: (string | number)[], height: number) => void;
}

export const FieldRenderContext = createContext<FieldRenderContextValue | null>(null);

export function useFieldRenderContext() {
  return useContext(FieldRenderContext);
}

/**
 * Provides a FieldRenderContext in inspector mode for a specific inspector entry.
 * Heights are stored inside the inspector entry (via inspectorStore) rather than
 * the flow store, so the inspector can have independent expanded heights from the
 * node canvas.
 */
export function InspectorFieldRenderProvider({
  entryId,
  children,
}: {
  entryId: string;
  children: React.ReactNode;
}) {
  // Reactively subscribe to this entry's fieldHeights object
  const fieldHeights = useInspectorStore((s) => {
    const entry = s.entries.find((e) => e.id === entryId);
    return (entry as Record<string, unknown> | undefined)?.fieldHeights as
      | Record<string, number>
      | undefined;
  });

  const value = useMemo<FieldRenderContextValue>(
    () => ({
      mode: "inspector",
      getHeightForPath: (path) => {
        const key = path.join(".");
        return fieldHeights?.[key];
      },
      setHeightForPath: (path, height) => {
        const key = path.join(".");
        updateInspectorData([entryId, "fieldHeights", key], height);
      },
    }),
    [entryId, fieldHeights],
  );

  return (
    <FieldRenderContext.Provider value={value}>
      {children}
    </FieldRenderContext.Provider>
  );
}
