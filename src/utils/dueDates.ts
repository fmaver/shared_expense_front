import type { DueDate } from '@/types/expense';

/**
 * Cuándo cae el próximo vencimiento de una serie.
 *
 * Es la misma regla que usa el backend para decidir cuándo mandar el aviso, replicada acá para
 * poder mostrar "vence el 9 de octubre" sin pedirlo: lo que la persona quiere leer es la fecha,
 * no los parámetros con los que se cargó ("día 9, cada 1 mes, desde octubre 2026").
 */
export function nextDueOccurrence(dueDate: DueDate, from: Date): Date {
  const anchor = dueDate.anchorYear * 12 + dueDate.anchorMonth;
  let year = from.getFullYear();
  let month = from.getMonth() + 1;

  for (let i = 0; i < 14 + dueDate.everyNMonths; i += 1) {
    const offset = year * 12 + month - anchor;
    if (offset >= 0 && offset % dueDate.everyNMonths === 0) {
      // Un vencimiento el 31 cae el 28 o el 30 en los meses que no llegan.
      const lastDay = new Date(year, month, 0).getDate();
      const candidate = new Date(year, month - 1, Math.min(dueDate.dayOfMonth, lastDay));
      if (candidate >= new Date(from.getFullYear(), from.getMonth(), from.getDate())) return candidate;
    }
    month += 1;
    if (month === 13) {
      year += 1;
      month = 1;
    }
  }
  return from;
}
