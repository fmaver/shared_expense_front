import React, { createContext, useContext, useState, useCallback } from 'react';

/** Add-entry actions for the personal area, registered by PersonalAddLauncher. */
export interface PersonalAddActions {
  /** Open the income dialog; omit `type` to start at the type picker. */
  addIncome: (type?: 'recurring' | 'variable') => void;
  addExpense: () => void;
  addRecurringExpense: () => void;
}

interface FabActionsContextValue {
  personalActions: PersonalAddActions | null;
  registerPersonalActions: (actions: PersonalAddActions | null) => void;
}

const FabActionsContext = createContext<FabActionsContextValue | null>(null);

export function FabActionsProvider({ children }: { children: React.ReactNode }) {
  const [personalActions, setPersonalActions] = useState<PersonalAddActions | null>(null);

  const registerPersonalActions = useCallback((actions: PersonalAddActions | null) => {
    setPersonalActions(actions);
  }, []);

  return (
    <FabActionsContext.Provider value={{ personalActions, registerPersonalActions }}>
      {children}
    </FabActionsContext.Provider>
  );
}

export function useFabActions(): FabActionsContextValue {
  const ctx = useContext(FabActionsContext);
  if (!ctx) throw new Error('useFabActions must be used inside FabActionsProvider');
  return ctx;
}
