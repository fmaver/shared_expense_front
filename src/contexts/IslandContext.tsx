import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

export type IslandState = 'idle' | 'loading' | 'success';

interface IslandContextValue {
  state: IslandState;
  loading: () => void;
  success: () => void;
  reset: () => void;
}

const IslandContext = createContext<IslandContextValue | null>(null);

export function IslandProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<IslandState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const loading = useCallback(() => {
    clearTimer();
    setState('loading');
  }, [clearTimer]);

  const success = useCallback(() => {
    clearTimer();
    setState('success');
    timerRef.current = setTimeout(() => {
      setState('idle');
      timerRef.current = null;
    }, 2000);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setState('idle');
  }, [clearTimer]);

  // Clear timer on unmount
  React.useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return (
    <IslandContext.Provider value={{ state, loading, success, reset }}>
      {children}
    </IslandContext.Provider>
  );
}

export function useIsland(): IslandContextValue {
  const ctx = useContext(IslandContext);
  if (!ctx) throw new Error('useIsland must be used inside IslandProvider');
  return ctx;
}
