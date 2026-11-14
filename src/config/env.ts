export const config = {
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  /** Link para instalar el atajo de iOS (iCloud). Opcional: sin él, el link no se muestra. */
  shortcutInstallUrl: (import.meta.env.VITE_SHORTCUT_URL as string | undefined) || '',
} as const;
