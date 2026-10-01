import type { GroupType } from '@/types/expense';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export interface SearchScope {
  groupId: number;
  groupName: string;
  /** Lo sabe quien abre desde el grupo; evita que el chip del alcance muestre otro tipo al abrir. */
  groupType?: GroupType;
}
interface SearchContextValue {
  open: boolean;
  scope: SearchScope | null;
  /**
   * Abre la búsqueda con el alcance dado (o general) y, si viene `query`, con ese texto ya
   * escrito — "Buscar en todo ›" y el link del mes lo usan para no perder lo que buscabas.
   */
  openSearch: (scope?: SearchScope, query?: string) => void;
  closeSearch: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  /** El overlay registra acá su `setQ`, para que `openSearch(…, query)` lo escriba. */
  registerQuerySetter: (setter: ((q: string) => void) | null) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<SearchScope | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // El texto vive en el overlay (cada tecla no re-renderiza a todos los que usan el contexto);
  // el contexto sólo guarda cómo escribirlo desde afuera.
  const querySetter = useRef<((q: string) => void) | null>(null);
  const registerQuerySetter = useCallback((setter: ((q: string) => void) | null) => {
    querySetter.current = setter;
  }, []);
  const openSearch = useCallback((next?: SearchScope, query?: string) => {
    setScope(next ?? null);
    if (query !== undefined) querySetter.current?.(query);
    setOpen(true);
    // El input ya está montado (invisible): enfocarlo acá, dentro del toque, es lo que hace que
    // iOS abra el teclado. Desde un efecto, después del render, no lo abre.
    inputRef.current?.focus();
  }, []);
  const closeSearch = useCallback(() => { setOpen(false); inputRef.current?.blur(); }, []);
  return (
    <SearchContext.Provider value={{ open, scope, openSearch, closeSearch, inputRef, registerQuerySetter }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used inside SearchProvider');
  return ctx;
}
