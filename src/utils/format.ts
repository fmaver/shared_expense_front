export function formatCurrency(amount: number, currency: string = 'ARS'): string {
  const curr = currency === 'USD' ? 'USD' : 'ARS';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: curr,
    maximumFractionDigits: 2,
  }).format(amount);
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