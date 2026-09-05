import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Routes the app when a push notification is tapped while it is already open.
 *
 * Tapping a notification with the app closed opens the URL directly, so it always worked. With
 * the app already running the browser only *focuses* the existing window — it does not
 * navigate — and the user was left on whatever screen they had open, which is exactly not the
 * thing the notification was about.
 *
 * The service worker asks us to move rather than navigating the client itself: routing here
 * keeps it a client-side transition instead of a full reload, and it works even when the
 * worker does not yet control the page.
 */
export function usePushNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'navigate' || typeof event.data.url !== 'string') return;
      // Same-origin paths only: the URL comes from a push payload, and an absolute one would
      // let a notification send the app somewhere off-site.
      const url = event.data.url;
      if (!url.startsWith('/') || url.startsWith('//')) return;

      navigate(url);
      event.ports[0]?.postMessage({ handled: true });
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [navigate]);
}
