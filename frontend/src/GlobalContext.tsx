import React from 'react';

interface AppContextType {
  panels: { showInspector: boolean; showNodePicker: boolean };
  lastAutosaved: Date | null;
  setPanels: React.Dispatch<React.SetStateAction<{ showInspector: boolean; showNodePicker: boolean }>>;
  setLastAutosaved: React.Dispatch<React.SetStateAction<Date | null>>;
}

export const AppContext = React.createContext<AppContextType>({
  panels: { showInspector: false, showNodePicker: true },
  lastAutosaved: null,
  setPanels: () => {},
  setLastAutosaved: () => {},
});


interface InspectorContextType {
  isLocked: boolean;
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
  lockedNodeId: string | null;
  setLockedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedNodeId: string | null;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const InspectorContext = React.createContext<InspectorContextType>({
  isLocked: false,
  setIsLocked: () => {},
  lockedNodeId: null,
  setLockedNodeId: () => {},
  selectedNodeId: null,
  setSelectedNodeId: () => {},
});

interface FlowMetadataContextType {
  filename: string;
  setFilename: React.Dispatch<React.SetStateAction<string>>;
}

export const FlowMetadataContext = React.createContext<FlowMetadataContextType>({
  filename: '',
  setFilename: () => {},
});
