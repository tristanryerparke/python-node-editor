import { createContext, useContext, ReactNode } from 'react';

interface EdgeConnectedContextType {
  isConnected: boolean;
}

const EdgeConnectedContext = createContext<EdgeConnectedContextType | undefined>(undefined);

interface EdgeConnectedProviderProps {
  isConnected: boolean;
  children: ReactNode;
}

export function EdgeConnectedProvider({ isConnected, children }: EdgeConnectedProviderProps) {
  return (
    <EdgeConnectedContext.Provider value={{ isConnected }}>
      {children}
    </EdgeConnectedContext.Provider>
  );
}

export function useEdgeConnected() {
  const context = useContext(EdgeConnectedContext);
  if (context === undefined) {
    throw new Error('useEdgeConnected must be used within an EdgeConnectedProvider');
  }
  return context;
}
