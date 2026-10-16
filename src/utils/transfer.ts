import type { DebtTransfer, ExpenseCreate } from '@/types/expense';

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * La fecha del pago: dentro del mes que se está saldando.
 *
 * Un gasto cae en el mes de su fecha. Fechado hoy, el pago de una deuda de septiembre marcado
 * en octubre caía en octubre: septiembre seguía debiendo, el cierre automático le generaba
 * además un balanceo por el mismo monto, y octubre quedaba con un préstamo de más. Por eso:
 * hoy si hoy cae en ese mes, el último día si el mes ya pasó, el primero si todavía no llegó
 * (cuotas). `null` es un evento, que no tiene meses: hoy.
 */
export function transferDate(period: { year: number; month: number } | null, today = new Date()): string {
  if (!period) return iso(today);
  const first = new Date(period.year, period.month - 1, 1);
  const last = new Date(period.year, period.month, 0);
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (day < first) return iso(first);
  if (day > last) return iso(last);
  return iso(day);
}

/**
 * El gasto que representa un pago entre dos personas.
 *
 * Marcar un transfer como hecho no es un estado aparte: se anota como un movimiento de
 * categoría `prestamo` que mueve el saldo igual que cualquier otro gasto, con el monto exacto
 * a cargo de quien lo recibe. Así el backend recalcula solo y no hace falta endpoint nuevo.
 *
 * Vive acá porque lo arman dos pantallas —la lista del grupo y el home personal— y tienen que
 * armarlo idéntico, o el mismo pago quedaría distinto según dónde lo marcaste.
 */
export function buildTransferExpense(
  transfer: DebtTransfer,
  fromName: string,
  toName: string,
  period: { year: number; month: number } | null,
  today = new Date(),
): ExpenseCreate {
  const date = transferDate(period, today);
  return {
    description: `${fromName} → ${toName}`,
    amount: transfer.amount,
    date,
    category: { name: 'prestamo' },
    payerId: transfer.fromMemberId,
    paymentType: 'debit',
    installments: 1,
    currency: 'ARS',
    splitStrategy: { type: 'exact', amounts: { [transfer.toMemberId]: transfer.amount } },
  };
}
