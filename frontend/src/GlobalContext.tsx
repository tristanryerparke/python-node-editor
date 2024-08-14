import React from 'react';

interface PanelsContextType {
  panels: { showInspector: boolean; showNodePicker: boolean };
  setPanels: React.Dispatch<React.SetStateAction<{ showInspector: boolean; showNodePicker: boolean }>>;
}

export const PanelsContext = React.createContext<PanelsContextType>({
  panels: { showInspector: false, showNodePicker: true },
  setPanels: () => {},
});