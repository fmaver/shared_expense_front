/**
 * Paleta de los gráficos — una sola fuente de verdad para recharts.
 *
 * Son los mismos colores que el resto de la app (handoff §3): los seis de avatar para lo
 * categórico, y los semánticos anclados en `positive` / `brand` / `negative` para que un
 * ingreso sea verde y un gasto grupal naranja en cualquier gráfico, igual que en las cifras.
 *
 * Van como hex y no como `hsl(var(--token))` porque recharts los escribe en atributos SVG,
 * donde una variable CSS no resuelve. Si la paleta de §3 cambia, cambian acá también.
 */

/** Paleta categórica — los seis colores de avatar, en orden. */
export const CHART_COLORS = [
  '#E98A2B', // brand
  '#8C5A2B', // marrón
  '#6B4A8C', // violeta
  '#1C5A8C', // azul
  '#1F8A5B', // verde
  '#C2452D', // rojo
  '#B8651A', // brand-ink
  '#1F6B57', // verde USD
  '#8E2617', // negative-ink
] as const;

/** Colores fijos por rol, para que el significado no cambie de gráfico en gráfico. */
export const SERIES = {
  income: '#1F8A5B',    // positive — lo que entra
  personal: '#C2452D',  // negative — lo que gastás vos
  groups: '#E98A2B',    // brand — lo que te toca de los grupos
  thisMonth: '#E98A2B', // brand — el período en curso
  lastMonth: '#C9BEB0', // muted-3 — la referencia anterior
} as const;
