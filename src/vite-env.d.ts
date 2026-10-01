/// <reference types="vite/client" />

/** La versión de package.json, inyectada en el build por vite.config.ts. */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** "true" prende la fila de comprobante (sin backend todavía). */
  readonly VITE_FEATURE_RECEIPTS?: string;
}
