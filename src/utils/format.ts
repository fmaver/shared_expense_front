export function formatCurrency(amount: number, currency: string = 'ARS'): string {
  const curr = currency === 'USD' ? 'USD' : 'ARS';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: curr,
    // Pesos sin centavos, dólares con ellos — mismo criterio que `useCurrency`.
    maximumFractionDigits: curr === 'USD' ? 2 : 0,
  }).format(amount).replace(/\u00A0/g, '');
}

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatDate(date: string | Date, forDisplay: boolean = false): string {
  const inputDate = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;

  if (forDisplay) {
    // Consistent DD/MM/YYYY across all displays
    const day = String(inputDate.getDate()).padStart(2, '0');
    const month = String(inputDate.getMonth() + 1).padStart(2, '0');
    const year = inputDate.getFullYear();
    return `${day}/${month}/${year}`;
  } else {
    // For new dates, ensure we're using local timezone date
    if (date instanceof Date) {
      return `${inputDate.getFullYear()}-${String(inputDate.getMonth() + 1).padStart(2, '0')}-${String(inputDate.getDate()).padStart(2, '0')}`;
    }
    // For existing dates (strings), keep using ISO format
    return inputDate.toISOString().split('T')[0];
  }
}
/**
 * `YYYY-MM-DD` leído como fecha local.
 *
 * `new Date("2026-07-12")` se interpreta en UTC y en Argentina (UTC-3) retrocede al 11.
 * El mediodía es el ancla que usa el resto del archivo por la misma razón.
 */
function parseLocal(date: string | Date): Date {
  return typeof date === 'string' ? new Date(`${date}T12:00:00`) : date;
}

/**
 * "12 jul" — la fecha como la lee el metadato de una fila de gasto.
 *
 * Los nombres de mes llegan desde i18n (`t('monthsShort', { returnObjects: true })`) en vez de
 * salir del locale del navegador: el idioma de la app lo elige el usuario y no tienen por qué
 * coincidir.
 */
export function formatDayMonth(date: string | Date, monthsShort: string[]): string {
  const d = parseLocal(date);
  return `${d.getDate()} ${monthsShort[d.getMonth()] ?? ''}`.trim();
}

/** "8 jun 2026" — el encabezado de un grupo de resultados de búsqueda con fecha exacta. */
export function formatDayMonthYear(date: string | Date, monthsShort: string[]): string {
  const d = parseLocal(date);
  return `${formatDayMonth(d, monthsShort)} ${d.getFullYear()}`.trim();
}

/** "lun 8 jul" — el subtítulo del detalle de gasto. */
export function formatWeekdayDayMonth(
  date: string | Date,
  monthsShort: string[],
  weekdaysShort: string[],
): string {
  const d = parseLocal(date);
  const weekday = weekdaysShort[d.getDay()] ?? '';
  return `${weekday} ${formatDayMonth(d, monthsShort)}`.trim();
}

/**
 * La fecha de la cuota 1 de un gasto en cuotas.
 *
 * Las cuotas son una fila por mes, así que la primera cae tantos meses atrás como cuotas
 * hayan pasado. Sirve para poder navegar hasta ella, que es donde se edita.
 */
export function firstInstallmentDate(date: string | Date, installmentNo: number): Date {
  const d = parseLocal(date);
  return new Date(d.getFullYear(), d.getMonth() - (installmentNo - 1), 1);
}

/**
 * El monto tal como se tipea en el teclado ("1250,5"), como número para la API.
 *
 * Viaja como string mientras se escribe porque "1250," es un estado intermedio válido que
 * ningún número puede representar.
 */
export function parseKeypadAmount(value: string): number {
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Cuántos dígitos enteros admite el monto, y cuántos decimales. */
const AMOUNT_MAX_WHOLE = 12;
const AMOUNT_MAX_DECIMALS = 2;

/**
 * Lo que el usuario tipeó en el campo de monto, llevado al formato crudo del estado: sólo
 * dígitos y una coma, con hasta dos decimales ("12500", "1250,5").
 *
 * El campo muestra separador de miles ("12.500"), así que los puntos que llegan son de miles
 * y se descartan. La excepción es un punto recién tipeado al final sin coma todavía: en un
 * teclado con punto decimal es la tecla decimal, y se toma como coma.
 */
export function sanitizeAmount(input: string): string {
  let s = input.replace(/[^\d.,]/g, '');
  if (s.endsWith('.') && !s.includes(',')) s = `${s.slice(0, -1)},`;
  s = s.replace(/\./g, '');
  const [whole, ...rest] = s.split(',');
  const digits = whole.replace(/^0+(?=\d)/, '').slice(0, AMOUNT_MAX_WHOLE);
  if (rest.length === 0) return digits;
  return `${digits || '0'},${rest.join('').slice(0, AMOUNT_MAX_DECIMALS)}`;
}

/** El monto crudo ("12500,5") como se muestra en el campo: "12.500,5". */
export function formatAmountInput(raw: string): string {
  if (!raw) return '';
  const [whole, decimals] = raw.split(',');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
}

/** Un monto de la API, como string para el teclado. Los enteros van sin decimales. */
export function formatKeypadAmount(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount === 0) return '';
  return Number.isInteger(amount) ? String(amount) : String(amount).replace('.', ',');
}

/**
 * "VIERNES 12 JUL" — el encabezado de un día en la lista de gastos.
 *
 * Agrupar por día le da ritmo a la lista y evita repetir la fecha en cada fila.
 */
export function formatDayHeading(
  date: string | Date,
  monthsShort: string[],
  weekdays: string[],
): string {
  const d = parseLocal(date);
  const weekday = weekdays[d.getDay()] ?? '';
  return `${weekday} ${d.getDate()} ${monthsShort[d.getMonth()] ?? ''}`.trim();
}

/**
 * "Hoy 9:36" / "12 jul 9:36" — el sello de algo que pasó en este dispositivo.
 *
 * Lleva la hora porque marcar un pago es un acto puntual: "hoy" solo no distingue el pago que
 * marcaste recién del que marcaste a la mañana.
 */
export function formatStamp(ts: number, monthsShort: string[], todayWord: string): string {
  const d = new Date(ts);
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  const now = new Date();
  const sameDay = d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
  return sameDay ? `${todayWord} ${time}` : `${formatDayMonth(d, monthsShort)} ${time}`;
}

/** Días de calendario transcurridos desde `ts`. Hoy es 0, ayer 1. */
export function daysSince(ts: number, now: number = Date.now()): number {
  const a = new Date(ts); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

/**
 * "$530k", "$1,2M" — el monto abreviado.
 *
 * Para cuando la cifra es una referencia y no el dato: en una fila de lista, seis dígitos
 * compiten con el nombre que está al lado. Abajo de mil no se abrevia nada: "$840" ya es corto.
 */
export function formatCompactCurrency(amount: number, currency: string = 'ARS'): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  const symbol = currency === 'USD' ? 'US$' : '$';
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const text = millions >= 10 ? Math.round(millions).toString() : millions.toFixed(1).replace('.', ',');
    return `${sign}${symbol}${text}M`;
  }
  if (abs >= 1_000) return `${sign}${symbol}${Math.round(abs / 1_000)}k`;
  return `${sign}${symbol}${Math.round(abs)}`;
}
