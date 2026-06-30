import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface ScrollContextValue {
  isAtTop: boolean;
  tabBarCollapsed: boolean;
  notifyScroll: (scrollTop: number) => void;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [isAtTop, setIsAtTop] = useState(true);
  const [tabBarCollapsed, setTabBarCollapsed] = useState(false);
  const prevRef = useRef(0);

  const notifyScroll = useCallback((scrollTop: number) => {
    const prev = prevRef.current;
    setIsAtTop(scrollTop < 8);
    if (scrollTop <= 60) {
      setTabBarCollapsed(false);
    } else if (scrollTop > prev) {
      setTabBarCollapsed(true);
    } else if (scrollTop < prev) {
      setTabBarCollapsed(false);
    }
    prevRef.current = scrollTop;
  }, []);

  return (
    <ScrollContext.Provider value={{ isAtTop, tabBarCollapsed, notifyScroll }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScroll(): ScrollContextValue {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScroll must be used inside ScrollProvider');
  return ctx;
}
