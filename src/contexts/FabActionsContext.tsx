import React, { createContext, useContext, useState, useCallback } from 'react';

interface FabActionsContextValue {
  personalAdd: (() => void) | null;
  registerPersonalAdd: (fn: (() => void) | null) => void;
}

const FabActionsContext = createContext<FabActionsContextValue | null>(null);

export function FabActionsProvider({ children }: { children: React.ReactNode }) {
  const [personalAdd, setPersonalAdd] = useState<(() => void) | null>(null);

  const registerPersonalAdd = useCallback((fn: (() => void) | null) => {
    // Store as a function-returning-fn to avoid React treating fn itself as a state updater
    setPersonalAdd(fn === null ? null : () => fn);
  }, []);

  return (
    <FabActionsContext.Provider value={{ personalAdd, registerPersonalAdd }}>
      {children}
    </FabActionsContext.Provider>
  );
}

export function useFabActions(): FabActionsContextValue {
  const ctx = useContext(FabActionsContext);
  if (!ctx) throw new Error('useFabActions must be used inside FabActionsProvider');
  return ctx;
}
