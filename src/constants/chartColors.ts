/**
 * Paleta de los gráficos — una sola fuente de verdad para recharts.
 *
 * Piel violeta (ADDENDUM-violeta.md): los semánticos vienen de v2.1.0 y se usan sólo para
 * barras y puntos, nunca para texto — ingreso verde salvia, personal ocre, grupos y el mes en
 * curso violeta, el mes anterior gris pizarra. Así un ingreso se lee igual en cualquier gráfico.
 *
 * Van como hex y no como `hsl(var(--token))` porque recharts los escribe en atributos SVG,
 * donde una variable CSS no resuelve. Si la paleta cambia, cambian acá también.
 */

/** Paleta categórica — arranca por los cuatro semánticos y sigue con tonos de la paleta. */
export const CHART_COLORS = [
  '#7C6BC4', // violeta — grupos
  '#C99A5B', // ocre — personal
  '#6FA97D', // salvia — ingreso
  '#8A93A6', // pizarra — mes anterior
  '#A99BEA', // brand-soft
  '#1C5A8C', // azul
  '#C62828', // negative
  '#4A3C96', // violeta profundo
  '#156B45', // positive
] as const;

/** Colores fijos por rol, para que el significado no cambie de gráfico en gráfico. */
export const SERIES = {
  income: '#6FA97D',    // lo que entra
  personal: '#C99A5B',  // lo que gastás vos
  groups: '#7C6BC4',    // lo que te toca de los grupos
  thisMonth: '#7C6BC4', // el período en curso
  lastMonth: '#8A93A6', // la referencia anterior
} as const;
