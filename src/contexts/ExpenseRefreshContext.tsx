import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * A lightweight refresh signal for group monthly data.
 *
 * The mobile FAB launcher (`GroupExpenseLauncher`) lives in `AppShell`, a
 * sibling subtree to the routed group pages, so it cannot call their local
 * `refetch`. It bumps `refreshSignal` instead; any mounted view reading group
 * monthly data (via `useMonthlyBalance`, plus the charts trend) reacts and
 * refetches.
 */
interface ExpenseRefreshContextValue {
  refreshSignal: number;
  requestExpenseRefresh: () => void;
}

const ExpenseRefreshContext = createContext<ExpenseRefreshContextValue>({
  refreshSignal: 0,
  requestExpenseRefresh: () => {},
});

export function ExpenseRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshSignal, setRefreshSignal] = useState(0);

  const requestExpenseRefresh = useCallback(() => {
    setRefreshSignal(s => s + 1);
  }, []);

  return (
    <ExpenseRefreshContext.Provider value={{ refreshSignal, requestExpenseRefresh }}>
      {children}
    </ExpenseRefreshContext.Provider>
  );
}

export function useExpenseRefresh(): ExpenseRefreshContextValue {
  return useContext(ExpenseRefreshContext);
}
