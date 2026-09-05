/**
 * Push-only service worker.
 *
 * It registers no `fetch` handler and caches nothing, on purpose. A service worker that never
 * intercepts requests cannot serve a stale bundle — which is the usual cost of adding one, and
 * something this app has already been bitten by once after a deploy.
 */

// Take over pages that are already open. Without this the worker controls nothing until the
// next navigation, and `client.navigate()` — which only works on a controlled client — fails
// silently on the very case that matters: tapping a notification with the app already open.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    // A malformed payload should still surface something rather than nothing.
    payload = { title: 'Jirens', body: event.data.text(), url: '/' };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Jirens', {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async windows => {
      const client = windows[0];
      if (!client) return self.clients.openWindow(target);

      // Tell the running app where to go and let react-router handle it. A message reaches
      // any client the worker can see, controlled or not, and routing in-app avoids the full
      // reload that `navigate()` costs. The app answers so we know it was actually handled.
      let routed = false;
      try {
        routed = await new Promise(resolve => {
          const channel = new MessageChannel();
          const timer = setTimeout(() => resolve(false), 500);
          channel.port1.onmessage = e => {
            clearTimeout(timer);
            resolve(Boolean(e.data?.handled));
          };
          client.postMessage({ type: 'navigate', url: target }, [channel.port2]);
        });
      } catch {
        routed = false;
      }

      if ('focus' in client) await client.focus();

      // Nothing answered — an old bundle without the listener, or a page mid-load.
      if (!routed) {
        try {
          await client.navigate(target);
        } catch {
          await self.clients.openWindow(target);
        }
      }
      return undefined;
    }),
  );
});
