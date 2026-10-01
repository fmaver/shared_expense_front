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

/**
 * WhatsApp como canal de avisos. Apagado: WhatsApp empezó a cobrar por conversación y el
 * backend lo cortó detrás de `WHATSAPP_ENABLED` (default off). La opción queda a la vista pero
 * deshabilitada en el perfil, y una preferencia WHATSAPP guardada se muestra como Email, que es
 * por donde el backend la manda. Constante y no env: tiene que ir a la par del backend, y
 * prenderlo de nuevo es un cambio de código en los dos lados.
 */
export const WHATSAPP_ENABLED = false;
