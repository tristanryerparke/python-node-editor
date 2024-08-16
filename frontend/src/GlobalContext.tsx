import React from 'react';

interface PanelsContextType {
  panels: { showInspector: boolean; showNodePicker: boolean };
  setPanels: React.Dispatch<React.SetStateAction<{ showInspector: boolean; showNodePicker: boolean }>>;
}

export const PanelsContext = React.createContext<PanelsContextType>({
  panels: { showInspector: false, showNodePicker: true },
  setPanels: () => {},
});


// Selection Context
interface NodeSelectionContextType {
  selectedNodeId: string | null;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
}
export const NodeSelectionContext = React.createContext<NodeSelectionContextType>({
  selectedNodeId: null,
  setSelectedNodeId: () => {},
});