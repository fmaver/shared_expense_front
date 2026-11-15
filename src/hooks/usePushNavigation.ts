import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Must match public/sw.js.
const PENDING_NAV_CACHE = 'push-nav';
const PENDING_NAV_KEY = '/__pending-push-nav';
// A tap older than this is not what the person is looking at anymore.
const PENDING_NAV_MAX_AGE_MS = 5 * 60 * 1000;

/** Same-origin paths only: the URL comes from a push payload, and an absolute one would let a
 *  notification send the app somewhere off-site. */
function isAppPath(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

/** The destination a tapped notification left for us, removed as it is read. */
async function takePendingTarget(): Promise<string | null> {
  if (!('caches' in window)) return null;
  try {
    const cache = await caches.open(PENDING_NAV_CACHE);
    const response = await cache.match(PENDING_NAV_KEY);
    if (!response) return null;
    await cache.delete(PENDING_NAV_KEY);
    const { url, at } = (await response.json()) as { url?: unknown; at?: number };
    if (!isAppPath(url) || typeof at !== 'number' || Date.now() - at > PENDING_NAV_MAX_AGE_MS) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Routes the app when a push notification is tapped while it is already open.
 *
 * Tapping a notification with the app closed opens the URL directly, so it always worked. With
 * the app already running the browser only *focuses* the existing window — it does not
 * navigate — and the user was left on whatever screen they had open.
 *
 * Two paths, because iOS suspends an installed app in the background:
 * - the service worker posts a `navigate` message, which an awake app handles at once;
 * - the worker also saves the destination, and the app reads it whenever it comes back to the
 *   foreground. On iOS the message to a suspended app can be lost, and this is what still lands
 *   the tap on the right screen.
 */
export function usePushNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const go = (url: string) => {
      if (window.location.pathname + window.location.search === url) return;
      navigate(url);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'navigate' || !isAppPath(event.data.url)) return;
      const url = event.data.url;
      go(url);
      // Handled here, so the saved copy must not route a second time later.
      void takePendingTarget();
      event.ports[0]?.postMessage({ handled: true });
    };

    const consumePending = () => {
      if (document.visibilityState !== 'visible') return;
      void takePendingTarget().then(url => {
        if (url) go(url);
      });
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', consumePending);
    window.addEventListener('focus', consumePending);
    window.addEventListener('pageshow', consumePending);
    consumePending();

    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', consumePending);
      window.removeEventListener('focus', consumePending);
      window.removeEventListener('pageshow', consumePending);
    };
  }, [navigate]);
}
