/**
 * La guía "instalá la app" (pop-up en el navegador del celular).
 *
 * Todo lo que decide si se muestra y qué pasos ofrece vive acá, fuera del componente, para que
 * las reglas se lean juntas:
 * - sólo en un celular (iOS o Android) y sólo en el navegador, nunca en la PWA instalada;
 * - "Ya la tengo instalada" la apaga para siempre en ese navegador (desde Safari no hay forma de
 *   saber si la app ya está instalada);
 * - "Ahora no" la pospone unos días;
 * - no aparece en la visita que llegó por un link de grupo o de invitación: esos links abren el
 *   navegador aunque la persona ya tenga la app, y aceptar ahí es inevitable.
 *
 * La plataforma se lee del user agent: los pasos son distintos en iPhone y en Android, y eso no
 * lo puede decidir un breakpoint de CSS.
 */

export type InstallPlatform = 'ios' | 'android' | 'inapp';

const DISMISS_KEY = 'installGuide.dismissedUntil';
const FROM_LINK_KEY = 'installGuide.cameFromLink';
const SNOOZE_DAYS = 7;
const FOREVER = 'forever';

/** True when running as an installed web app rather than a browser tab. */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS predates display-mode and exposes its own flag.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iOS, Android o el navegador interno de otra app (Instagram, Facebook…), donde no se puede instalar. */
export function detectPlatform(): InstallPlatform | null {
  const ua = navigator.userAgent;
  if (/Instagram|FBAN|FBAV|Line\//.test(ua)) return 'inapp';
  // iPadOS se presenta como Mac; lo delata el touch.
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return null;
}

/** `?installGuide=ios|android|inapp` fuerza la guía con esa plataforma, para verla en la compu. */
export function forcedPlatform(): InstallPlatform | null {
  const value = new URLSearchParams(window.location.search).get('installGuide');
  return value === 'ios' || value === 'android' || value === 'inapp' ? value : null;
}

function read(storage: Storage, key: string): string | null {
  try { return storage.getItem(key); } catch { return null; }
}

function write(storage: Storage, key: string, value: string) {
  try { storage.setItem(key, value); } catch { /* modo privado: la guía vuelve a aparecer, nada más */ }
}

/** Las páginas de unirse o aceptar una invitación lo marcan para el resto de la visita. */
export function markCameFromGroupLink() {
  write(sessionStorage, FROM_LINK_KEY, '1');
}

export function shouldShowInstallGuide(): InstallPlatform | null {
  const forced = forcedPlatform();
  if (forced) return forced;
  if (isStandalone()) return null;
  if (read(sessionStorage, FROM_LINK_KEY)) return null;
  const until = read(localStorage, DISMISS_KEY);
  if (until === FOREVER) return null;
  if (until && Number(until) > Date.now()) return null;
  return detectPlatform();
}

export function dismissInstallGuide(forever: boolean) {
  write(localStorage, DISMISS_KEY, forever ? FOREVER : String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000));
}

/* ── Android: el aviso nativo de instalación ─────────────────────────────────────────────
   Chrome dispara `beforeinstallprompt` una vez, al cargar, antes de que la guía se monte. Se
   guarda acá a nivel de módulo (este archivo se importa desde App) para poder ofrecer un botón
   "Instalar" de verdad. Si no llegó (otro navegador, o ya instalada), van los pasos a mano. */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    dismissInstallGuide(true);
  });
}

export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

/** Abre el diálogo nativo de Chrome. true si la persona aceptó. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const event = deferredPrompt;
  deferredPrompt = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === 'accepted';
}
