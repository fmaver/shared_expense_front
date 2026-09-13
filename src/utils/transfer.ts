import type { DebtTransfer, ExpenseCreate } from '@/types/expense';

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
  today = new Date(),
): ExpenseCreate {
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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
