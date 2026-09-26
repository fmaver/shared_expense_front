import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * El alta de tu plata, registrada por `PersonalAddLauncher`.
 *
 * El "+" flotante vive en otro árbol del DOM que las pantallas personales, así que no puede
 * abrir sus hojas directamente: el launcher publica acá cómo hacerlo.
 */
export interface PersonalAddActions {
  /** Abre "¿Qué anotamos?": las cuatro opciones en una grilla. */
  openMatrix: () => void;
  /** Salta la matriz y abre una de las cuatro directamente. */
  pick: (kind: 'expense' | 'fixed' | 'extra' | 'salary') => void;
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
