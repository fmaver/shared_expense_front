export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatDate(date: string | Date, forDisplay: boolean = false): string {
  const inputDate = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  
  if (forDisplay) {
    return inputDate.toLocaleDateString();
  } else {
    // For new dates, ensure we're using local timezone date
    if (date instanceof Date) {
      return `${inputDate.getFullYear()}-${String(inputDate.getMonth() + 1).padStart(2, '0')}-${String(inputDate.getDate()).padStart(2, '0')}`;
    }
    // For existing dates (strings), keep using ISO format
    return inputDate.toISOString().split('T')[0];
  }
}