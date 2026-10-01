/**
 * Funciones diseñadas que todavía no tienen backend (ADDENDUM-violeta.md V6.7).
 *
 * Apagada por defecto: en producción una foto de comprobante que no se guarda confunde más
 * de lo que ayuda. Se prende en local o en staging con `VITE_FEATURE_RECEIPTS=true`.
 *
 * - RECEIPTS: la fila "Comprobante" del formulario. El backend no guarda imágenes; la foto
 *   se muestra mientras dura la carga y no se persiste.
 */
export const FEATURE_RECEIPTS = import.meta.env.VITE_FEATURE_RECEIPTS === 'true';
