/**
 * Argentine phone-number helpers — the client-side mirror of the backend's
 * `normalize_ar_phone`. WhatsApp/Meta represents Argentine mobiles with an extra
 * "9" after the country code (549...), but the backend stores 54XXXXXXXXXX. We
 * normalize before sending so a stored number can never carry the stray 9.
 */

/**
 * Normalize loose input to the canonical stored form `54XXXXXXXXXX`.
 * Strips `+`, spaces, dashes, parentheses, a `00` international prefix and the
 * trunk `0`, drops the mobile `9` after the country code, and ensures a `54`
 * prefix. Returns `''` when there are no digits.
 */
export function normalizeArPhone(raw: string): string {
  let digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);

  let rest: string;
  if (digits.startsWith('54')) {
    rest = digits.slice(2);
  } else {
    rest = digits.startsWith('0') ? digits.slice(1) : digits;
  }
  if (rest.startsWith('9')) rest = rest.slice(1);

  return `54${rest}`;
}

/**
 * The local part (without the `54` country code) of a stored number, for
 * pre-filling the local-number field next to a fixed `+54` prefix.
 */
export function localArPhone(stored: string | null | undefined): string {
  if (!stored) return '';
  const canonical = normalizeArPhone(stored);
  return canonical.startsWith('54') ? canonical.slice(2) : canonical;
}
