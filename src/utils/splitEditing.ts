/**
 * Reparto por porcentajes o montos exactos al cargar un gasto.
 *
 * Funciones puras para que el formulario y el botón "Listo" lean la misma cuenta:
 * - `evenSplit` arranca repartido en partes iguales (así el reparto empieza válido);
 * - `splitStatus` dice cuánto falta o sobra contra el objetivo (100% o el monto del gasto);
 * - `fillRemainder` le suma la diferencia a un miembro para cerrar la cuenta.
 *
 * Tolerancias: las mismas que el backend (`PercentageSplit` acepta 100 ± 0,01 y los montos
 * exactos tienen que sumar el total al centavo).
 */

export type SplitValues = Record<string, number | null>;
export type EditableSplit = 'percentage' | 'exact';

const TOLERANCE = 0.01;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** `total` repartido entre `ids` al centavo; el último absorbe la diferencia del redondeo. */
export function evenSplit(ids: string[], total: number): SplitValues {
  if (ids.length === 0 || total <= 0) return Object.fromEntries(ids.map(id => [id, null]));
  const base = Math.floor((total / ids.length) * 100) / 100;
  const out: SplitValues = {};
  ids.forEach((id, i) => {
    out[id] = i === ids.length - 1 ? round2(total - base * (ids.length - 1)) : base;
  });
  return out;
}

export function splitTarget(type: EditableSplit, amount: number): number {
  return type === 'percentage' ? 100 : amount;
}

export interface SplitStatus {
  /** Lo que suma lo cargado. */
  sum: number;
  /** objetivo − suma: > 0 falta, < 0 sobra. */
  diff: number;
  ok: boolean;
}

export function splitStatus(type: EditableSplit, values: SplitValues | null | undefined, amount: number): SplitStatus {
  const sum = round2(Object.values(values ?? {}).reduce<number>((acc, v) => acc + (v ?? 0), 0));
  const diff = round2(splitTarget(type, amount) - sum);
  const target = splitTarget(type, amount);
  return { sum, diff, ok: target > 0 && Math.abs(diff) <= TOLERANCE };
}

/**
 * Le suma la diferencia a `id` (puede ser negativa: si sobra, se la resta), sin bajar de 0.
 * Si no alcanza con ese miembro (sobra más de lo que tiene), queda en 0 y el estado sigue
 * avisando; el botón sólo se ofrece cuando cierra.
 */
export function fillRemainder(values: SplitValues, id: string, diff: number): SplitValues {
  return { ...values, [id]: Math.max(0, round2((values[id] ?? 0) + diff)) };
}

/** El miembro que recibe "Completar con el resto": el último que no se tocó, o el último. */
export function remainderTarget(ids: string[], touched: Set<string>, values: SplitValues, diff: number): string | null {
  const untouched = ids.filter(id => !touched.has(id));
  const pool = untouched.length ? untouched : ids;
  // Si sobra, tiene que poder absorberlo sin quedar negativo.
  const fits = [...pool].reverse().find(id => diff >= 0 || (values[id] ?? 0) + diff >= -TOLERANCE);
  return fits ?? null;
}

/** "33,33" para mostrar en el campo; vacío si no hay valor. */
export function formatSplitInput(value: number | null | undefined): string {
  if (value == null) return '';
  return String(round2(value)).replace('.', ',');
}

/** Lo que se tipea ("33,5", "33.5") a número, o null si está vacío. */
export function parseSplitInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(',', '.');
  if (cleaned === '') return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Deja tipear sólo dígitos y una coma, con hasta dos decimales ("33,", "33,3"). */
export function sanitizeSplitInput(raw: string): string {
  let s = raw.replace(/\./g, ',').replace(/[^\d,]/g, '');
  const comma = s.indexOf(',');
  if (comma !== -1) s = s.slice(0, comma + 1) + s.slice(comma + 1).replace(/,/g, '').slice(0, 2);
  return s;
}
