import { createContext, useContext } from "react";
import { AnyData } from "../types/dataTypes/anyData";



interface InputDataUpdateContextType {
  updateData: (newData: AnyData) => void;
}

export const InputDataUpdateContext = createContext<InputDataUpdateContextType | undefined>(undefined);

export function useDataUpdate() {
  const context = useContext(InputDataUpdateContext);
  if (context === undefined) {
    throw new Error('useDataUpdate must be used within a InputDataUpdateContext');
  }
  return context;
}