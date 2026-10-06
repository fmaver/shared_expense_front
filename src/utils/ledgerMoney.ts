import type { PersonalLedgerResponse } from '@/types/expense';

/**
 * Las filas del ledger personal llegan en su moneda (un gasto en dólares trae `amount` en
 * dólares); los totales del backend, en pesos. Toda suma que haga el front tiene que pasar
 * cada fila a pesos con la MISMA cotización que usó el backend, así los subtotales cierran
 * contra sus totales. `usdRate` viene en la respuesta; si un backend viejo no lo manda, cae
 * en el blue del contexto.
 */
export function ledgerRate(ledger: Pick<PersonalLedgerResponse, 'usdRate'>, fallback: number | null): number {
  return ledger.usdRate ?? fallback ?? 1;
}

export function toArs(amount: number, currency: string | undefined, rate: number): number {
  return currency === 'USD' ? amount * rate : amount;
}

/** Suma en pesos de filas con moneda propia. */
export function sumArs(rows: { amount: number; currency?: string }[], rate: number): number {
  return rows.reduce((s, r) => s + toArs(r.amount, r.currency, rate), 0);
}
