import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export interface SearchScope { groupId: number; groupName: string }
interface SearchContextValue {
  open: boolean;
  scope: SearchScope | null;
  openSearch: (scope?: SearchScope) => void;
  closeSearch: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<SearchScope | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openSearch = useCallback((next?: SearchScope) => {
    setScope(next ?? null);
    setOpen(true);
    // El input ya está montado (invisible): enfocarlo acá, dentro del toque, es lo que hace que
    // iOS abra el teclado. Desde un efecto, después del render, no lo abre.
    inputRef.current?.focus();
  }, []);
  const closeSearch = useCallback(() => { setOpen(false); inputRef.current?.blur(); }, []);
  return (
    <SearchContext.Provider value={{ open, scope, openSearch, closeSearch, inputRef }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used inside SearchProvider');
  return ctx;
}
