import { useEffect, useState } from 'react';
import { getCurrentUser, type MemberResponse } from '@/api/auth';

/**
 * El miembro logueado.
 *
 * La fila de gasto necesita saber quién sos para decir "te deben" o "debés", y hay una fila
 * por gasto: sin cachear, una lista de 30 gastos dispararía 30 veces `/me`. La promesa se
 * comparte a nivel de módulo, así que la petición sale una sola vez por carga de la app.
 * El logout recarga la página entera, que es lo que limpia este caché.
 */
let pending: Promise<MemberResponse> | null = null;

export function useCurrentMember(): MemberResponse | null {
  const [member, setMember] = useState<MemberResponse | null>(null);

  useEffect(() => {
    let alive = true;
    pending ??= getCurrentUser();
    pending
      .then(m => { if (alive) setMember(m); })
      // Un fallo no se propaga: la fila simplemente no muestra tu parte. Se limpia el caché
      // para que el próximo montaje vuelva a intentar.
      .catch(() => { pending = null; });
    return () => { alive = false; };
  }, []);

  return member;
}
