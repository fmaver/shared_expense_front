import type { ExpenseResponse, Member, SplitStrategy } from '@/types/expense';

/** Cómo se reparte un gasto, resuelto a montos por persona. */
export interface ExpenseSplit {
  /** Ids que participan del reparto, en orden estable. */
  participantIds: number[];
  /** Cuánto le toca a cada participante. */
  byMember: Record<number, number>;
  /**
   * True cuando el reparto es el normal: partes iguales entre todo el grupo.
   *
   * Es la condición que decide si la fila lleva badge de división o no
   * (principio 2 del handoff: lo normal no se etiqueta).
   */
  isEven: boolean;
}

type SplittableExpense = Pick<ExpenseResponse, 'amount' | 'splitStrategy' | 'payerId'>;

/**
 * Reparto de un gasto entre los miembros.
 *
 * El backend, en `EqualSplit`, le asigna la diferencia de redondeo a un miembro puntual; acá
 * se divide parejo porque la diferencia es de centavos y esto sólo alimenta lo que se muestra.
 * Ningún cálculo de saldo sale de esta función: los saldos los manda el backend.
 */
export function computeSplit(expense: SplittableExpense, members: Member[]): ExpenseSplit {
  const strategy: SplitStrategy = expense.splitStrategy;
  const amount = expense.amount;

  if (strategy.type === 'percentage' && strategy.percentages) {
    const entries = Object.entries(strategy.percentages)
      .map(([id, pct]) => [parseInt(id, 10), pct ?? 0] as const)
      .filter(([, pct]) => pct > 0);
    return {
      participantIds: entries.map(([id]) => id),
      byMember: Object.fromEntries(entries.map(([id, pct]) => [id, (amount * pct) / 100])),
      isEven: false,
    };
  }

  if (strategy.type === 'exact' && strategy.amounts) {
    const entries = Object.entries(strategy.amounts)
      .map(([id, value]) => [parseInt(id, 10), value ?? 0] as const);
    return {
      participantIds: entries.map(([id]) => id),
      byMember: Object.fromEntries(entries),
      isEven: false,
    };
  }

  // equal — con o sin subconjunto de participantes
  const subset = strategy.participantIds;
  const ids = subset && subset.length > 0 ? subset : members.map(m => m.id);
  const share = ids.length > 0 ? amount / ids.length : 0;
  return {
    participantIds: ids,
    byMember: Object.fromEntries(ids.map(id => [id, share])),
    isEven: !subset || subset.length === 0 || subset.length === members.length,
  };
}

/** Lo que le toca pagar a un miembro. 0 si no participa. */
export function shareOf(split: ExpenseSplit, memberId: number | null | undefined): number {
  if (memberId == null) return 0;
  return split.byMember[memberId] ?? 0;
}

/**
 * Posición de un miembro en un gasto: positivo si le deben, negativo si debe.
 *
 * Quien paga adelanta el total y se lleva de vuelta todo menos su parte.
 */
export function netOf(
  expense: SplittableExpense,
  split: ExpenseSplit,
  memberId: number | null | undefined,
): number {
  if (memberId == null) return 0;
  const paid = expense.payerId === memberId ? expense.amount : 0;
  return paid - shareOf(split, memberId);
}

/** True cuando el miembro no pagó ni le toca parte: el gasto no lo incluye. */
export function isOutsider(
  expense: SplittableExpense,
  split: ExpenseSplit,
  memberId: number | null | undefined,
): boolean {
  if (memberId == null) return false;
  return expense.payerId !== memberId && !(memberId in split.byMember);
}
