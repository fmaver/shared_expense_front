import React, { createContext, useContext, useState, useCallback } from 'react';

interface ScrollContextValue {
  isAtTop: boolean;
  notifyScroll: (scrollTop: number) => void;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [isAtTop, setIsAtTop] = useState(true);

  const notifyScroll = useCallback((scrollTop: number) => {
    setIsAtTop(scrollTop < 8);
  }, []);

  return (
    <ScrollContext.Provider value={{ isAtTop, notifyScroll }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScroll(): ScrollContextValue {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScroll must be used inside ScrollProvider');
  return ctx;
}
