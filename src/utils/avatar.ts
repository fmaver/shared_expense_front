/**
 * Avatares de persona.
 *
 * El color se asigna por id de miembro y no por posición en la lista: la misma persona
 * tiene que verse igual en la fila de gasto, en el detalle, en saldos y en el grupo,
 * aunque cada pantalla ordene distinto.
 */

/** Los seis colores de avatar del handoff (§3), en orden. */
const AVATAR_BG = [
  'bg-avatar-1',
  'bg-avatar-2',
  'bg-avatar-3',
  'bg-avatar-4',
  'bg-avatar-5',
  'bg-avatar-6',
] as const;

/** Clase de fondo estable para un miembro. Los seis colores llevan texto blanco. */
export function avatarBg(memberId: number | string): string {
  const id = typeof memberId === 'number' ? memberId : parseInt(memberId, 10);
  // -1 para que el miembro 1 reciba el primer color de la paleta (el naranja de marca).
  const index = Number.isFinite(id) ? ((id - 1) % AVATAR_BG.length + AVATAR_BG.length) % AVATAR_BG.length : 0;
  return AVATAR_BG[index];
}

/**
 * Iniciales de un nombre. Una letra para los avatares de fila; dos donde el diseño
 * las pide (reparto, saldos).
 */
export function initials(name: string, max = 1): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('');
  return (letters || '?').slice(0, max).toUpperCase();
}
