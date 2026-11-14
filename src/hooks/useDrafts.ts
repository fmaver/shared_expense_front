import { useCallback, useEffect, useRef, useState } from 'react';
import { getDrafts } from '@/api/drafts';
import { useExpenseRefresh } from '@/contexts/ExpenseRefreshContext';
import type { Draft } from '@/types/expense';

/**
 * Los borradores pendientes de la carga rápida.
 *
 * Vuelve a pedirlos cuando la ventana recupera el foco (mandar una captura desde el atajo de
 * iOS y volver a la PWA, que quedó abierta con la lista vieja) y con la señal de
 * `requestExpenseRefresh` (un "Dejar para después" en la misma pantalla).
 *
 * Cada pedido lleva un número; solo el último escribe el estado. Sin eso, una respuesta lenta
 * de antes de confirmar podía llegar después del refetch y volver a mostrar el borrador ya
 * confirmado.
 *
 * `error` queda en true si el último pedido falló: una lista vacía por error no es lo mismo
 * que no tener pendientes.
 */
export function useDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const latest = useRef(0);
  const { refreshSignal } = useExpenseRefresh();

  const refetch = useCallback(async () => {
    const request = ++latest.current;
    try {
      const data = await getDrafts();
      if (request === latest.current) {
        setDrafts(data);
        setError(false);
      }
    } catch {
      // Un fallo no borra lo que ya se ve: la tarjeta y la lista quedan como estaban.
      if (request === latest.current) setError(true);
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requests = latest;
    const onFocus = () => { refetch(); };
    const onVisible = () => { if (document.visibilityState === 'visible') refetch(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      // Lo que esté en vuelo al desmontar ya no escribe.
      requests.current++;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refetch]);

  // Al montar y con cada señal de refresco de gastos.
  useEffect(() => {
    refetch();
  }, [refetch, refreshSignal]);

  return { drafts, loading, error, refetch };
}
