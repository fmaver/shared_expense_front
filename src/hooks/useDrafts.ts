import { useCallback, useEffect, useRef, useState } from 'react';
import { getDrafts } from '@/api/drafts';
import type { Draft } from '@/types/expense';

/**
 * Los borradores pendientes de la carga rápida.
 *
 * Vuelve a pedirlos cuando la ventana recupera el foco: el caso típico es mandar una captura
 * desde el atajo de iOS y volver a la PWA, que quedó abierta con la lista vieja.
 *
 * Cada pedido lleva un número; solo el último escribe el estado. Sin eso, una respuesta lenta
 * de antes de confirmar podía llegar después del refetch y volver a mostrar el borrador ya
 * confirmado.
 */
export function useDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const latest = useRef(0);

  const refetch = useCallback(async () => {
    const request = ++latest.current;
    try {
      const data = await getDrafts();
      if (request === latest.current) setDrafts(data);
    } catch {
      // Un fallo no borra lo que ya se ve: la tarjeta y la lista quedan como estaban.
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requests = latest;
    refetch();
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

  return { drafts, loading, refetch };
}
