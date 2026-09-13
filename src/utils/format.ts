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

/** Un monto de la API, como string para el teclado. Los enteros van sin decimales. */
export function formatKeypadAmount(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount === 0) return '';
  return Number.isInteger(amount) ? String(amount) : String(amount).replace('.', ',');
}
