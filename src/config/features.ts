/**
 * Funciones diseñadas que todavía no tienen backend (ADDENDUM-violeta.md V6.5 y V6.7).
 *
 * Apagadas por defecto: en producción un botón de buscar que dice "pronto", o una foto de
 * comprobante que no se guarda, confunden más de lo que ayudan. Se prenden en local o en
 * staging con `VITE_FEATURE_SEARCH=true` / `VITE_FEATURE_RECEIPTS=true`.
 *
 * - SEARCH: la lupa, la pantalla "Buscar" con su estado vacío y ⌘K. No hay endpoint de
 *   búsqueda: la pantalla sólo anuncia que viene.
 * - RECEIPTS: la fila "Comprobante" del formulario. El backend no guarda imágenes; la foto
 *   se muestra mientras dura la carga y no se persiste.
 */
export const FEATURE_SEARCH = import.meta.env.VITE_FEATURE_SEARCH === 'true';
export const FEATURE_RECEIPTS = import.meta.env.VITE_FEATURE_RECEIPTS === 'true';
