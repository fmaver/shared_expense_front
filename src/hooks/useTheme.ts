import { useCallback, useEffect, useState } from 'react';

/** `system` sigue al sistema operativo y cambia con él, sin volver a entrar a la app. */
export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStored(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function apply(preference: ThemePreference) {
  const dark = preference === 'dark' || (preference === 'system' && prefersDark());
  document.documentElement.classList.toggle('dark', dark);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(readStored);

  useEffect(() => {
    apply(theme);
    // "system" no se guarda: la ausencia de valor ES seguir al sistema, y así el script de
    // arranque de index.html —que corre antes que React— decide lo mismo sin leer otra clave.
    if (theme === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Con "system" elegido, el tema tiene que cambiar cuando el sistema cambia, no en el
  // próximo arranque.
  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => setThemeState(next), []);

  /** Alterna claro ⇄ oscuro. Lo usa el botón del sidebar, que no tiene lugar para tres estados. */
  const toggle = useCallback(() => {
    setThemeState(current => {
      const isDark = current === 'dark' || (current === 'system' && prefersDark());
      return isDark ? 'light' : 'dark';
    });
  }, []);

  /** Qué se está viendo ahora mismo, ya resuelto. */
  const resolved: 'light' | 'dark' =
    theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme;

  return { theme, resolved, setTheme, toggle };
}
