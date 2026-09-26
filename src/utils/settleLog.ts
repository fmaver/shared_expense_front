/**
 * Lo que este teléfono hizo mientras se saldaba un mes.
 *
 * El backend no guarda nada de esto y no hace falta que lo guarde: un pago marcado **es** el
 * movimiento de categoría `prestamo`, y avisar todavía no tiene endpoint —se resuelve con la
 * hoja nativa de compartir—. Pero el diseño quiere decir "lo marcaste vos" y "le avisaste hace
 * dos días", y eso sólo lo sabe el dispositivo donde pasó.
 *
 * Por eso vive en `localStorage` y se cuenta como lo que es: algo que hiciste vos, acá. En otro
 * dispositivo simplemente no aparece la línea, que es la verdad y no una mentira prolija.
 */

export interface SettleLog {
  /** id del movimiento `prestamo` → cuándo lo marcaste, en ms. */
  marked: Record<string, number>;
  /** id de la persona → cuándo le avisaste, en ms. */
  reminded: Record<string, number>;
}

const EMPTY: SettleLog = { marked: {}, reminded: {} };

/**
 * El período al que pertenece el registro. Un grupo de evento no tiene meses: su plan es uno
 * solo y corre hasta que se cierra el grupo, así que todo su registro va junto.
 */
export function settleScope(groupId: number, isOneTime: boolean, year: number, month: number): string {
  return isOneTime ? `${groupId}.all` : `${groupId}.${year}-${String(month).padStart(2, '0')}`;
}

const storageKey = (scope: string) => `jirens.settle.${scope}`;

export function readSettleLog(scope: string): SettleLog {
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<SettleLog>;
    return { marked: parsed.marked ?? {}, reminded: parsed.reminded ?? {} };
  } catch {
    // Modo privado, almacenamiento lleno o JSON corrupto: sin registro, sin línea.
    return EMPTY;
  }
}

function write(scope: string, log: SettleLog): SettleLog {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(log));
  } catch { /* si no se puede guardar, la pantalla sigue funcionando igual */ }
  return log;
}

export function logMarked(scope: string, expenseId: number, at: number = Date.now()): SettleLog {
  const log = readSettleLog(scope);
  return write(scope, { ...log, marked: { ...log.marked, [expenseId]: at } });
}

export function logUnmarked(scope: string, expenseId: number): SettleLog {
  const log = readSettleLog(scope);
  const marked = { ...log.marked };
  delete marked[expenseId];
  return write(scope, { ...log, marked });
}

export function logReminded(scope: string, memberIds: number[], at: number = Date.now()): SettleLog {
  const log = readSettleLog(scope);
  const reminded = { ...log.reminded };
  for (const id of memberIds) reminded[id] = at;
  return write(scope, { ...log, reminded });
}
