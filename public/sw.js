/**
 * Push-only service worker.
 *
 * It registers no `fetch` handler and caches nothing, on purpose. A service worker that never
 * intercepts requests cannot serve a stale bundle — which is the usual cost of adding one, and
 * something this app has already been bitten by once after a deploy.
 */

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
    // Focus an open window when there is one instead of opening a duplicate.
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      for (const client of windows) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
