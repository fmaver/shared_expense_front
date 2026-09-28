import { useCallback, useEffect, useRef, useState } from 'react';
import { searchExpenses } from '@/api/search';
import { parseQuery } from '@/utils/search';
import type { ExpenseSearchResult } from '@/types/expense';

const DEBOUNCE_MS = 250;

export function useExpenseSearch(q: string, groupId?: number) {
  const [results, setResults] = useState<ExpenseSearchResult[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const requestId = useRef(0);
  const active = parseQuery(q) !== null;

  useEffect(() => {
    if (!active) { setResults([]); setHasMore(false); setError(null); setLoading(false); return; }
    const id = ++requestId.current;
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      searchExpenses(q, groupId, controller.signal)
        .then(data => {
          if (id !== requestId.current) return; // una respuesta vieja que llegó tarde
          setResults(data.results); setHasMore(data.hasMore); setError(null);
        })
        .catch(err => {
          if (id !== requestId.current || controller.signal.aborted) return;
          setError(err instanceof Error ? err.message : 'Error');
        })
        .finally(() => { if (id === requestId.current) setLoading(false); });
    }, DEBOUNCE_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q, groupId, active, nonce]);

  const retry = useCallback(() => setNonce(n => n + 1), []);
  return { results, hasMore, loading, error, retry, active };
}
