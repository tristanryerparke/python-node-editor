import { createContext, useContext } from 'react';
import { InputField } from '../types/nodeTypes';

interface FieldContextType {
  field: InputField;
  updateField: (newField: InputField, index: number) => void;
  index: number;
}

export const FieldContext = createContext<FieldContextType | undefined>(undefined);

export function useField() {
  const context = useContext(FieldContext);
  if (context === undefined) {
    throw new Error('useField must be used within a FieldProvider');
  }
  return context;
} 