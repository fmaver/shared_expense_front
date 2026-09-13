import React, { createContext, useContext, useMemo, useState } from 'react';

interface ViewedMonthState {
  /** El mes que se está mirando ya está saldado: la carga va a otro lado. */
  isSettled: boolean;
  /** Tu saldo en el grupo, para el sidebar de desktop. `null` cuando nadie lo publicó. */
  yourBalance?: number | null;
}

interface SettlementContextValue extends ViewedMonthState {
  setViewedMonthState: (state: ViewedMonthState) => void;
}

const SettlementContext = createContext<SettlementContextValue | null>(null);

/**
 * El estado del mes que se está mirando, publicado para el resto del chrome.
 *
 * El FAB vive en la barra flotante y la lista vive en la página: son dos árboles distintos, y
 * el "+" tiene que verse apagado cuando el mes está cerrado (§6.6). En vez de que la barra
 * repita el pedido del balance, la página publica lo que ya sabe.
 */
export function SettlementProvider({ children }: { children: React.ReactNode }) {
  const [state, setViewedMonthState] = useState<ViewedMonthState>({
    isSettled: false,
    yourBalance: null,
  });
  const value = useMemo(
    () => ({ ...state, setViewedMonthState }),
    [state],
  );
  return <SettlementContext.Provider value={value}>{children}</SettlementContext.Provider>;
}

export function useSettlementState(): SettlementContextValue {
  const ctx = useContext(SettlementContext);
  // Fuera del provider el chrome simplemente no sabe nada del mes, y eso es válido.
  return ctx ?? { isSettled: false, yourBalance: null, setViewedMonthState: () => {} };
}
