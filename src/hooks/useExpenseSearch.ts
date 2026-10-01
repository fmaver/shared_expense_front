import { useCallback, useEffect, useRef, useState } from 'react';
import { searchExpenses } from '@/api/search';
import { parseQuery } from '@/utils/search';
import type { ExpenseSearchResult } from '@/types/expense';

const DEBOUNCE_MS = 250;

/** Los resultados, junto al alcance para el que se pidieron. */
interface Fetched {
  groupId: number | undefined;
  results: ExpenseSearchResult[];
  hasMore: boolean;
}

const EMPTY: ExpenseSearchResult[] = [];

export function useExpenseSearch(q: string, groupId?: number) {
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const requestId = useRef(0);
  const active = parseQuery(q) !== null;

  useEffect(() => {
    if (!active) { setFetched(null); setError(null); setLoading(false); return; }
    const id = ++requestId.current;
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      searchExpenses(q, groupId, controller.signal)
        .then(data => {
          if (id !== requestId.current) return; // una respuesta vieja que llegó tarde
          setFetched({ groupId, results: data.results, hasMore: data.hasMore }); setError(null);
        })
        .catch(err => {
          if (id !== requestId.current || controller.signal.aborted) return;
          setError(err instanceof Error ? err.message : 'Error');
        })
        .finally(() => { if (id === requestId.current) setLoading(false); });
    }, DEBOUNCE_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q, groupId, active, nonce]);

  /*
    Los resultados de otro alcance no se muestran: al pasar de un grupo a "Buscar en todo" los
    del grupo quedarían bajo la búsqueda general (con sus filtros) hasta que llegue la respuesta.
  */
  const fresh = fetched && fetched.groupId === groupId ? fetched : null;
  const retry = useCallback(() => setNonce(n => n + 1), []);
  return {
    results: fresh ? fresh.results : EMPTY,
    hasMore: fresh ? fresh.hasMore : false,
    // Mientras el alcance no coincide, se está cargando: así no se ve "no encontramos nada".
    loading: loading || (active && !error && fresh === null),
    error,
    retry,
    active,
  };
}
