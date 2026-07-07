/**
 * Centralized chart palette — single source of truth for recharts colors.
 *
 * Muted, brand-anchored (violet `--brand` ≈ hsl(270 40% 45%)) hues chosen to
 * read acceptably on both light (`--card` white) and dark (`--card` slate)
 * grounds, so no per-mode branching is needed. Prefer the semantic `SERIES`
 * entries for fixed roles (income / expenses / groups) and `CHART_COLORS`
 * (cycled by index) for categorical breakdowns.
 */

/** Categorical palette — cycled by `i % CHART_COLORS.length` for donuts/bars. */
export const CHART_COLORS = [
  '#7C6BC4', // violet (brand-anchored)
  '#4C9A94', // teal
  '#C99A5B', // gold
  '#C56B7B', // rose
  '#5B82C4', // blue
  '#6FA97D', // green
  '#B072A6', // mauve
  '#5FAAB0', // cyan
  '#C08457', // terracotta
] as const;

/** Semantic colors for fixed series (keep meaning stable across charts). */
export const SERIES = {
  income: '#6FA97D', // green — money in
  personal: '#C99A5B', // gold — personal spend
  groups: '#7C6BC4', // brand violet — group shares
  thisMonth: '#7C6BC4', // brand violet — current-period line
  lastMonth: '#8A93A6', // muted slate — reference / prior-period line
} as const;
