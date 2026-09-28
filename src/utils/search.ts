/*
  Espejo de service_layer/search_query.py: mismas palabras, mismos acentos, mismo monto. La lupa
  del mes filtra en el cliente con esto y la general le pregunta al backend; tienen que coincidir.
*/
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
