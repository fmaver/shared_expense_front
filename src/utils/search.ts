/*
  Espejo de service_layer/search_query.py: mismas palabras, mismos acentos, mismo monto. La lupa
  del mes filtra en el cliente con esto y la general le pregunta al backend; tienen que coincidir.
*/
import type { ExpenseSearchResult } from '@/types/expense';

const ACCENTS_FROM = 'áàâäéèêëíìîïóòôöúùûüñç';
const ACCENTS_TO = 'aaaaeeeeiiiioooouuuunc';
const MIN_TEXT_LENGTH = 2;

export function normalize(text: string): string {
  let out = '';
  for (const ch of text.toLowerCase()) {
    const i = ACCENTS_FROM.indexOf(ch);
    out += i >= 0 ? ACCENTS_TO[i] : ch;
  }
  return out;
}

export function parseAmount(text: string): number | null {
  const v = text.trim();
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(v) || /^\d+(,\d{1,2})?$/.test(v)) {
    return Number(v.replace(/\./g, '').replace(',', '.'));
  }
  if (/^\d+\.\d{1,2}$/.test(v)) return Number(v);
  return null;
}

export interface ParsedQuery {
  terms: string[];
  amount: number | null;
}

export function parseQuery(q: string): ParsedQuery | null {
  const stripped = q.trim();
  const amount = parseAmount(stripped);
  if (amount === null && stripped.length < MIN_TEXT_LENGTH) return null;
  const terms = normalize(stripped).split(/\s+/).filter(Boolean);
  return terms.length ? { terms, amount } : null;
}

/** ¿Coincide un gasto? `fields` son los textos donde buscar (descripción, pagador). */
export function matchesQuery(fields: string[], amount: number, q: ParsedQuery): boolean {
  const haystack = fields.map(normalize);
  const byText = q.terms.every(term => haystack.some(f => f.includes(term)));
  const byAmount = q.amount !== null && Math.abs(amount - q.amount) < 0.005;
  return byText || byAmount;
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

/**
 * Parte `text` en tramos marcando las coincidencias de cada palabra de `query`, comparando
 * con la misma normalización que el resto de la búsqueda (sin acentos, minúsculas) pero
 * devolviendo el texto **original** (con acentos) — sólo el fondo del resaltado cambia.
 * El término numérico de un monto (p. ej. buscar "500") nunca se resalta: no tiene sentido
 * resaltar una coincidencia de texto que en realidad vino por monto.
 */
export function highlightParts(text: string, query: string): HighlightPart[] {
  const parsed = parseQuery(query);
  if (!parsed) return [{ text, match: false }];
  const terms = parsed.terms.filter(term => parseAmount(term) === null);
  if (!terms.length) return [{ text, match: false }];

  // `normalize` reemplaza cada carácter uno a uno (sin cambiar la longitud), así que la
  // posición en `norm` es la misma posición en `text` — podemos marcar por índice y después
  // devolver el texto original con sus acentos intactos.
  const norm = normalize(text);
  const marks = new Array<boolean>(text.length).fill(false);
  for (const term of terms) {
    if (!term) continue;
    let idx = norm.indexOf(term);
    while (idx !== -1) {
      for (let i = idx; i < idx + term.length; i++) marks[i] = true;
      idx = norm.indexOf(term, idx + 1);
    }
  }

  const parts: HighlightPart[] = [];
  let i = 0;
  while (i < text.length) {
    let j = i;
    while (j < text.length && marks[j] === marks[i]) j++;
    parts.push({ text: text.slice(i, j), match: marks[i] });
    i = j;
  }
  return parts.length ? parts : [{ text, match: false }];
}

/** Saca el sufijo " (n/N)" de una descripción de cuota, si lo tiene. */
export function baseDescription(desc: string): string {
  return desc.replace(/\s\(\d+\/\d+\)$/, '');
}

export interface Purchase {
  key: string;
  /** La cuota de menor `installmentNo` — su `date` es la fecha de compra. */
  first: ExpenseSearchResult;
  /** Todas las cuotas encontradas de esta compra, ordenadas por `installmentNo`. */
  items: ExpenseSearchResult[];
}

/**
 * Agrupa resultados de búsqueda por compra original: todas las cuotas de un mismo
 * `parentExpenseId` (dentro del mismo grupo) van juntas. Sin `parentExpenseId` (gastos
 * recurrentes personales), cada resultado es su propia "compra" de un solo ítem.
 * Conserva el orden de llegada de la primera aparición de cada compra.
 */
export function groupPurchases(results: ExpenseSearchResult[]): Purchase[] {
  const byKey = new Map<string, Purchase>();
  const order: string[] = [];
  for (const r of results) {
    const key = `${r.groupId}:${r.parentExpenseId ?? `${r.kind}:${r.id}`}`;
    let purchase = byKey.get(key);
    if (!purchase) {
      purchase = { key, first: r, items: [] };
      byKey.set(key, purchase);
      order.push(key);
    }
    purchase.items.push(r);
  }
  return order.map(key => {
    const purchase = byKey.get(key)!;
    purchase.items.sort((a, b) => a.installmentNo - b.installmentNo);
    purchase.first = purchase.items[0];
    return purchase;
  });
}
